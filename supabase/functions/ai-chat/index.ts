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

    // Fetch current products with enhanced data for better recommendations
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .is('deleted_at', null)
      .eq('in_stock', true)
      .order('rating', { ascending: false });

    // Also fetch out of stock products for alternative suggestions
    const { data: outOfStockProducts, error: outOfStockError } = await supabase
      .from('products')
      .select('*')
      .is('deleted_at', null)
      .eq('in_stock', false)
      .order('rating', { ascending: false });

    const allProducts = [...(products || []), ...(outOfStockProducts || [])];

    if (productsError) {
      console.error('Error fetching in-stock products:', productsError);
    }
    
    if (outOfStockError) {
      console.error('Error fetching out-of-stock products:', outOfStockError);
    }

    console.log(`Product fetch results:`, {
      inStock: products?.length || 0,
      outOfStock: outOfStockProducts?.length || 0,
      total: allProducts?.length || 0,
      productsError: productsError?.message,
      outOfStockError: outOfStockError?.message
    });

    console.log(`Found ${allProducts?.length || 0} total products (${products?.length || 0} in stock, ${outOfStockProducts?.length || 0} out of stock)`);

    // Prepare enhanced products context with better categorization
    const inStockContext = products?.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      original_price: product.original_price ? Number(product.original_price) : null,
      category: product.category,
      in_stock: true,
      rating: product.rating ? Number(product.rating) : 0,
      reviews_count: product.reviews_count || 0,
      badge: product.badge,
      badge_color: product.badge_color,
      images: product.images ? JSON.parse(product.images) : []
    })) || [];

    const outOfStockContext = outOfStockProducts?.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      original_price: product.original_price ? Number(product.original_price) : null,
      category: product.category,
      in_stock: false,
      rating: product.rating ? Number(product.rating) : 0,
      reviews_count: product.reviews_count || 0,
      badge: product.badge,
      badge_color: product.badge_color,
      images: product.images ? JSON.parse(product.images) : []
    })) || [];

    // Categorize products for better recommendations
    const productsByCategory = inStockContext.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, any[]>);

    // Get best-rated products
    const topRatedProducts = inStockContext
      .filter(p => p.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    // Get budget-friendly options
    const budgetProducts = inStockContext
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);

    // Get premium options
    const premiumProducts = inStockContext
      .sort((a, b) => b.price - a.price)
      .slice(0, 5);

    // Enhanced system context with live product data and intelligent recommendations
    const enhancedContext = `${WEBSITE_CONTEXT}

🔥 CRITICAL: SMART PRODUCT RECOMMENDATION SYSTEM ACTIVE 🔥
You now have real-time access to SmartHub Computers' complete inventory with advanced recommendation capabilities.

📊 LIVE INVENTORY SUMMARY:
- Total Products: ${allProducts?.length || 0}
- In Stock: ${products?.length || 0} products
- Out of Stock: ${outOfStockProducts?.length || 0} products
- Categories Available: ${Object.keys(productsByCategory).length}

🏆 TOP-RATED PRODUCTS (Best Customer Satisfaction):
${topRatedProducts.map(p => `• ${p.name} - KES ${p.price.toLocaleString()} (⭐ ${p.rating}/5.0, ${p.reviews_count} reviews)`).join('\n')}

💰 BUDGET-FRIENDLY OPTIONS (Under KES 50,000):
${budgetProducts.map(p => `• ${p.name} - KES ${p.price.toLocaleString()}${p.original_price ? ` (Was KES ${p.original_price.toLocaleString()})` : ''}`).join('\n')}

💎 PREMIUM PRODUCTS (High-End Performance):
${premiumProducts.map(p => `• ${p.name} - KES ${p.price.toLocaleString()}${p.badge ? ` [${p.badge}]` : ''}`).join('\n')}

📂 PRODUCTS BY CATEGORY:
${Object.entries(productsByCategory).map(([category, prods]) => 
  `${category.toUpperCase()}: ${prods.length} products (${prods.slice(0, 3).map(p => p.name).join(', ')}${prods.length > 3 ? '...' : ''})`).join('\n')}

🎯 INTELLIGENT RECOMMENDATION GUIDELINES:
1. **ALWAYS** check actual stock status before recommending
2. **PRIORITIZE** in-stock products over out-of-stock ones
3. **MATCH** customer budget with appropriate price ranges
4. **SUGGEST** alternatives from same category if preferred item unavailable
5. **HIGHLIGHT** discounts (original_price > current price)
6. **MENTION** ratings and reviews to build confidence
7. **OFFER** multiple options (budget, mid-range, premium)
8. **EXPLAIN** why you're recommending specific products

🔍 COMPLETE PRODUCT DATABASE:
IN STOCK PRODUCTS:
${JSON.stringify(inStockContext, null, 2)}

OUT OF STOCK PRODUCTS (for alternative suggestions):
${JSON.stringify(outOfStockContext, null, 2)}

🎭 ENHANCED BEHAVIOR:
- Analyze customer needs first (budget, use case, preferences)
- Provide 2-3 specific product recommendations with reasons
- Include exact prices in KES format
- Mention stock status clearly
- Offer alternatives if items unavailable
- Compare products when helpful
- Suggest complementary accessories when appropriate

Remember: You are a smart sales assistant with complete inventory knowledge. Make data-driven recommendations that truly help customers find their perfect tech solution!`;

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
        console.log('Rate limit hit, providing intelligent product recommendations');
        
        // When API is rate limited, provide smart product recommendations using our data
        const productRecommendations = inStockContext.slice(0, 5).map(p => 
          `• **${p.name}** - KES ${p.price.toLocaleString()}${p.original_price && p.original_price > p.price ? ` (Was KES ${p.original_price.toLocaleString()})` : ''}${p.rating > 0 ? ` ⭐ ${p.rating}/5` : ''}`
        ).join('\n');

        const categoryList = Object.keys(productsByCategory).map(cat => 
          `• **${cat}**: ${productsByCategory[cat].length} products available`
        ).join('\n');

        return new Response(JSON.stringify({ 
          response: `Hi there! 👋 Welcome to SmartHub Computers!

🔥 **Here's what we have in stock for you:**

${productRecommendations}

📂 **Browse by Category:**
${categoryList}

💰 **Special Offers:**
${inStockContext.filter(p => p.original_price && p.original_price > p.price).length > 0 ? 
  `We have ${inStockContext.filter(p => p.original_price && p.original_price > p.price).length} products on sale right now!` : 
  'Check our website for the latest deals and promotions!'}

🏪 **Visit us:**
📍 Koinange Street, Uniafric House Room 208, Nairobi
📞 0704144239
🌐 https://smarthubcomputers.com

What specific type of computer or tech solution are you looking for? I can help you find the perfect match from our ${products?.length || 0} in-stock products!`,
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