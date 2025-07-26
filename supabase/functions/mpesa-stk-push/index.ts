import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface STKPushRequest {
  order_id: string;
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { order_id, phone_number, amount, account_reference, transaction_desc }: STKPushRequest = await req.json();

    console.log('STK Push request:', { order_id, phone_number, amount, account_reference });

    // Validate required fields
    if (!order_id || !phone_number || !amount) {
      throw new Error('Missing required fields: order_id, phone_number, amount');
    }

    // Format phone number (remove leading 0 and add 254)
    const formattedPhone = phone_number.startsWith('0') 
      ? '254' + phone_number.substring(1)
      : phone_number.startsWith('254') 
        ? phone_number 
        : '254' + phone_number;

    console.log('Formatted phone number:', formattedPhone);

    // Get M-Pesa credentials from environment
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const businessShortCode = Deno.env.get('MPESA_BUSINESS_SHORTCODE');
    const passkey = Deno.env.get('MPESA_PASSKEY');
    const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL') || `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`;

    if (!consumerKey || !consumerSecret || !businessShortCode || !passkey) {
      throw new Error('Missing M-Pesa API credentials');
    }

    // Step 1: Get OAuth token
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
      },
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get OAuth token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('OAuth token obtained successfully');

    // Step 2: Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = btoa(`${businessShortCode}${passkey}${timestamp}`);

    // Step 3: Initiate STK Push
    const stkPushPayload = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: account_reference || order_id,
      TransactionDesc: transaction_desc || `Payment for Order ${order_id}`,
    };

    console.log('STK Push payload:', stkPushPayload);

    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushPayload),
    });

    const stkData = await stkResponse.json();
    console.log('STK Push response:', stkData);

    if (!stkResponse.ok || stkData.errorCode) {
      throw new Error(`STK Push failed: ${stkData.errorMessage || 'Unknown error'}`);
    }

    // Step 4: Update order with STK push details
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Update NCBA Loop payment record with STK push details
    const { error: updateError } = await supabaseService
      .from('ncba_loop_payments')
      .update({
        status: 'stk_sent',
        account_number: stkData.CheckoutRequestID,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', order_id);

    if (updateError) {
      console.error('Error updating payment record:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'STK push sent successfully',
        CheckoutRequestID: stkData.CheckoutRequestID,
        MerchantRequestID: stkData.MerchantRequestID,
        CustomerMessage: stkData.CustomerMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('STK Push error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});