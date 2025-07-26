import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
const WHATSAPP_VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SMARTHUB_CONTEXT = `
You are a WhatsApp customer service agent for SmartHub Computers, a computer store in Kenya.

BUSINESS INFO:
- Location: Koinange Street, Uniafric House Room 208, Nairobi, Kenya
- Hours: Monday to Saturday, 9 AM to 6 PM
- Phone: 0704144239
- Email: smarthub278@gmail.com
- Website: smarthubcomputers.lovable.app

PRODUCTS & SERVICES:
- Laptops: Gaming laptops, business laptops, ultrabooks
- Desktop Computers: Budget PCs to high-performance gaming and workstation systems
- Computer Components: Graphics cards, processors, RAM, storage
- Accessories: Keyboards, mice, monitors, cables

PRICING & PAYMENT:
- Computers start from KES 30,000 to high-end systems
- Payment methods: M-Pesa, bank transfers, cash, card payments
- Installment plans available for purchases above KES 50,000
- Free delivery for orders above KES 50,000
- Shipping fees: KES 500 (Nairobi), KES 700 (rest of Kenya)

Act as a helpful, knowledgeable customer service representative. Keep responses concise and friendly. For specific product availability and detailed specs, direct customers to visit our website at smarthubcomputers.lovable.app.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // Handle webhook verification (GET request)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return new Response(challenge, { status: 200 });
    } else {
      console.log('Webhook verification failed');
      return new Response('Forbidden', { status: 403 });
    }
  }

  // Handle incoming messages (POST request)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('Received webhook:', JSON.stringify(body, null, 2));

      // Process webhook data
      if (body.entry && body.entry[0]?.changes && body.entry[0].changes[0]?.value?.messages) {
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from;
        const messageBody = message.text?.body;

        if (messageBody) {
          console.log(`Received message from ${from}: ${messageBody}`);
          
          // Generate AI response
          const aiResponse = await generateAIResponse(messageBody);
          
          // Send response back to WhatsApp
          await sendWhatsAppMessage(from, aiResponse);
        }
      }

      return new Response('OK', { 
        status: 200,
        headers: corsHeaders 
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: corsHeaders 
      });
    }
  }

  return new Response('Method not allowed', { 
    status: 405,
    headers: corsHeaders 
  });
});

async function generateAIResponse(userMessage: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "I'm sorry, I'm experiencing technical difficulties. Please call us at 0704144239 or email smarthub278@gmail.com for immediate assistance.";
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ 
            text: `${SMARTHUB_CONTEXT}\n\nCustomer message: ${userMessage}\n\nPlease respond as a helpful SmartHub Computers customer service agent.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || 
           "Thank you for contacting SmartHub Computers! For immediate assistance, please call 0704144239 or visit our website at smarthubcomputers.lovable.app";

  } catch (error) {
    console.error('Error generating AI response:', error);
    return "Thank you for contacting SmartHub Computers! We're here to help with all your computer needs. Please call 0704144239 or visit smarthubcomputers.lovable.app for product information.";
  }
}

async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error('WhatsApp credentials not configured');
    return;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send WhatsApp message:', errorText);
    } else {
      console.log('WhatsApp message sent successfully');
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}