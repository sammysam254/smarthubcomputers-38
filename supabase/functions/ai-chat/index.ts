import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  siteContext?: string;
}

interface TicketRequest {
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  userId?: string;
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const WEBSITE_CONTEXT = `
You are an AI customer service agent for SmartHub Computers, a computer store in Kenya that sells:

PRODUCTS & SERVICES:
- Laptops: Gaming laptops, business laptops, ultrabooks
- Desktop Computers: Budget PCs to high-performance gaming and workstation systems
- Computer Components: Graphics cards, processors, RAM, storage
- Accessories: Keyboards, mice, monitors, cables

BUSINESS INFO:
- Location: Koinange Street, Uniafric House Room 208, Nairobi, Kenya
- Hours: Monday to Saturday, 9 AM to 6 PM
- Phone: 0704144239
- Email: support@smarthubcomputers.com
- Website: https://smarthubcomputers.com
- Website features: Products catalog, flash sales, vouchers, user accounts, cart system

PRICING & PAYMENT:
- Computers start from KES 30,000 to high-end systems
- Payment methods: M-Pesa, bank transfers, cash, card payments
- Installment plans available for purchases above KES 50,000
- Competitive pricing across all products

DELIVERY & SHIPPING:
- Nairobi: Same-day or next-day delivery
- Nationwide: 2-3 business days shipping
- Free delivery for orders above KES 50,000
- Shipping fees: KES 500 (Nairobi), KES 700 (rest of Kenya)

WARRANTIES & SUPPORT:
- 1-2 year manufacturer warranties on most products
- Extended warranty options available
- Full warranty claim support
- Technical support and customer service

STOCK & PRODUCT QUERIES:
- For current stock availability and detailed product information, refer customers to visit https://smarthubcomputers.com
- The website has the most up-to-date inventory and product specifications
- Customers can browse categories, compare products, and check real-time availability

Act as a helpful, knowledgeable customer service representative. When customers ask about stock or specific product availability, direct them to check https://smarthubcomputers.com for the most current information. If customers need human assistance, inform them you can create a support ticket for them.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();

    if (action === 'chat') {
      return await handleChat(data as ChatRequest);
    } else if (action === 'create_ticket') {
      return await handleCreateTicket(data as TicketRequest);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleChat(data: ChatRequest): Promise<Response> {
  const { message, conversationHistory = [] } = data;

  console.log('Processing chat message:', message);
  console.log('GEMINI_API_KEY present:', !!GEMINI_API_KEY);
  console.log('GEMINI_API_KEY length:', GEMINI_API_KEY?.length || 0);

  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not configured');
    return new Response(JSON.stringify({ 
      response: 'I apologize, but I\'m experiencing technical difficulties. Our AI chat service requires a Gemini API key to be configured. Please contact our support team at support@smarthubcomputers.com for immediate assistance.',
      needsHumanSupport: true 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Processing chat message:', message);

    // Fetch current products from database for real-time product intelligence
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
    }

    console.log(`Found ${products?.length || 0} products in database`);

    // Prepare products context for AI with current inventory
    const productsContext = products?.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      original_price: product.original_price,
      category: product.category,
      in_stock: product.in_stock,
      rating: product.rating,
      reviews_count: product.reviews_count,
      badge: product.badge,
      images: product.images ? JSON.parse(product.images) : []
    })) || [];

    // Enhanced system context with live product data
    const enhancedContext = `${WEBSITE_CONTEXT}

CRITICAL: LIVE PRODUCT INVENTORY ACCESS
You now have access to our real-time product database. Use this data to provide accurate stock information, pricing, and recommendations.

CURRENT INVENTORY (${products?.length || 0} products):
${JSON.stringify(productsContext, null, 2)}

PRODUCT INTELLIGENCE GUIDELINES:
1. **Stock Checking**: Always check the 'in_stock' field before answering availability questions
2. **Price Accuracy**: Use exact prices from database, format as "KES X,XXX"
3. **Smart Recommendations**: Suggest products based on available inventory, customer needs, ratings, and price range
4. **Category Understanding**: Search products by category when customers ask about specific types
5. **Alternative Suggestions**: If a product is out of stock, recommend similar available items
6. **Detailed Information**: Provide product descriptions, ratings, and specifications when relevant
7. **Value Comparison**: Mention discounts when original_price is higher than current price

ENHANCED RESPONSE BEHAVIOR:
- Scan the inventory data before answering any product-related questions
- Provide specific product names, prices, and stock status
- Make intelligent recommendations based on available products
- If no products match a query, explain clearly and suggest alternatives
- Always mention exact stock availability (in stock/out of stock)
- Help customers compare products and find the best options

Remember: You have live access to our current inventory, so provide accurate, real-time information to help customers make informed decisions.`;

    // Build conversation context with enhanced product intelligence
    const messages = [
      { role: 'user', parts: [{ text: enhancedContext }] },
      { role: 'model', parts: [{ text: 'I understand. I now have access to SmartHub Computers\' live product inventory and am ready to provide accurate stock information, pricing, and intelligent product recommendations to customers.' }] },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    console.log('Gemini API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error details:', errorText);
      
      if (response.status === 429) {
        console.log('Rate limit hit, providing helpful response');
        return new Response(JSON.stringify({ 
          response: `Hi there! 👋 I'm here to help you find the perfect computer or tech solution at SmartHub Computers!

🔥 **What I can help you with:**
• Find laptops, desktops, and accessories that match your needs
• Compare prices and specifications
• Get information about our current deals and promotions
• Answer questions about our products and services

💻 **Popular categories:**
• Gaming laptops and desktops
• Business computers
• Tablets and accessories
• Printers and office equipment

What are you looking for today? I'd be happy to help you find the right tech solution!`,
          needsHumanSupport: false
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Gemini API response:', JSON.stringify(result, null, 2));
    
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || 
                     'I apologize, but I encountered an issue processing your request. Please try again or contact our support team.';

    console.log('AI response generated with product intelligence');

    // Check if the response suggests creating a support ticket
    const needsHumanSupport = aiResponse.toLowerCase().includes('support ticket') || 
                             aiResponse.toLowerCase().includes('human assistance') ||
                             aiResponse.toLowerCase().includes('speak to someone');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      needsHumanSupport
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return new Response(JSON.stringify({ 
      response: 'I apologize, but I\'m experiencing technical difficulties. Please contact our support team at support@smarthubcomputers.com or call 0704144239 for immediate assistance.',
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleCreateTicket(data: TicketRequest): Promise<Response> {
  const { customerName, customerEmail, subject, message, userId } = data;

  try {
    // Create support ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId || null,
        subject: subject,
        description: message,
        status: 'open',
        priority: 'medium'
      })
      .select()
      .single();

    if (ticketError) {
      throw ticketError;
    }

    // Create initial message
    const { error: messageError } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: userId || null,
        sender_name: customerName,
        sender_email: customerEmail,
        message: message,
        is_internal: false
      });

    if (messageError) {
      throw messageError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      ticketId: ticket.id,
      message: 'Support ticket created successfully. Our team will respond within 24 hours.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create support ticket',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}