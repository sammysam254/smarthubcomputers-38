import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    console.log('Processing message:', message);

    // Fetch current products from database
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('deleted_at', null)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw new Error('Failed to fetch products');
    }

    console.log(`Found ${products?.length || 0} products in database`);

    // Prepare context for AI with current products data
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
      badge: product.badge
    })) || [];

    // Create system prompt with products context
    const systemPrompt = `You are a helpful customer service assistant for SmartHub Computers, a leading technology retailer specializing in computers, laptops, gaming equipment, and tech accessories.

IMPORTANT: You have access to our current product inventory. Always check the products data below before responding to customer inquiries about availability, pricing, or recommendations.

CURRENT PRODUCT INVENTORY:
${JSON.stringify(productsContext, null, 2)}

GUIDELINES:
1. Always check the product inventory above before answering questions about stock, availability, or pricing
2. When customers ask about specific products, search through the inventory and provide accurate information
3. If a product is out of stock (in_stock: false), inform the customer and suggest similar available alternatives
4. Provide detailed product information including price, description, ratings when relevant
5. Make intelligent recommendations based on available products and customer needs
6. For price comparisons, mention both current price and original price if available
7. Be friendly, professional, and helpful
8. If asked about products not in our inventory, politely explain we don't currently carry those items and suggest alternatives
9. Always format prices as "KES X,XXX" (Kenyan Shillings)
10. When recommending products, consider factors like price range, ratings, and customer needs

RESPONSE FORMAT:
- Be conversational and helpful
- Provide specific product details when relevant
- Include prices in KES format
- Mention stock status clearly
- Offer alternatives when primary choice is unavailable
- Keep responses concise but informative

Remember: You represent SmartHub Computers and should always strive to help customers find the best products for their needs from our available inventory.`;

    // Make request to Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nCustomer message: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response received');

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      'I apologize, but I\'m having trouble processing your request right now. Please try again or contact our support team.';

    return new Response(JSON.stringify({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-product-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred',
      response: 'I apologize, but I\'m experiencing technical difficulties. Please try again later or contact our support team directly.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});