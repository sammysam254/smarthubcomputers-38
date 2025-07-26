import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const callbackData = await req.json();
    console.log('M-Pesa callback received:', JSON.stringify(callbackData, null, 2));

    // Initialize Supabase client with service role key
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Extract callback data
    const stkCallback = callbackData.Body?.stkCallback;
    if (!stkCallback) {
      console.log('No stkCallback found in request');
      return new Response('OK', { status: 200 });
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const merchantRequestId = stkCallback.MerchantRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    console.log('Processing callback:', {
      checkoutRequestId,
      merchantRequestId,
      resultCode,
      resultDesc
    });

    // Find the payment record using CheckoutRequestID
    const { data: paymentRecord, error: findError } = await supabaseService
      .from('ncba_loop_payments')
      .select('*, orders(*)')
      .eq('account_number', checkoutRequestId)
      .single();

    if (findError || !paymentRecord) {
      console.error('Payment record not found:', findError);
      return new Response('Payment record not found', { status: 404 });
    }

    console.log('Found payment record:', paymentRecord.id);

    // Process successful payment
    if (resultCode === 0) {
      // Extract payment details from callback items
      let mpesaReceiptNumber = '';
      let transactionDate = '';
      let phoneNumber = '';
      let amount = 0;

      if (stkCallback.CallbackMetadata?.Item) {
        stkCallback.CallbackMetadata.Item.forEach((item: any) => {
          switch (item.Name) {
            case 'MpesaReceiptNumber':
              mpesaReceiptNumber = item.Value;
              break;
            case 'TransactionDate':
              transactionDate = item.Value;
              break;
            case 'PhoneNumber':
              phoneNumber = item.Value;
              break;
            case 'Amount':
              amount = item.Value;
              break;
          }
        });
      }

      console.log('Payment successful:', {
        mpesaReceiptNumber,
        transactionDate,
        phoneNumber,
        amount
      });

      // Update payment record
      const { error: updatePaymentError } = await supabaseService
        .from('ncba_loop_payments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          ncba_loop_message: `M-Pesa Payment Confirmed - Receipt: ${mpesaReceiptNumber}, Date: ${transactionDate}, Phone: ${phoneNumber}, Amount: ${amount}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.id);

      if (updatePaymentError) {
        console.error('Error updating payment record:', updatePaymentError);
      }

      // Update order status to confirmed
      const { error: updateOrderError } = await supabaseService
        .from('orders')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.order_id);

      if (updateOrderError) {
        console.error('Error updating order status:', updateOrderError);
      } else {
        console.log('Order confirmed successfully:', paymentRecord.order_id);
      }

    } else {
      // Payment failed
      console.log('Payment failed:', resultDesc);
      
      const { error: updateError } = await supabaseService
        .from('ncba_loop_payments')
        .update({
          status: 'failed',
          ncba_loop_message: `Payment Failed: ${resultDesc}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.id);

      if (updateError) {
        console.error('Error updating failed payment:', updateError);
      }

      // Update order status to failed
      const { error: updateOrderError } = await supabaseService
        .from('orders')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.order_id);

      if (updateOrderError) {
        console.error('Error updating order to failed:', updateOrderError);
      }
    }

    return new Response('OK', { 
      headers: corsHeaders,
      status: 200 
    });

  } catch (error) {
    console.error('Callback processing error:', error);
    return new Response('Internal Server Error', { 
      headers: corsHeaders,
      status: 500 
    });
  }
});