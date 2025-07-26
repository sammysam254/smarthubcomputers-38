import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  customerName: string;
  subject: string;
  ticketId: string;
  message?: string;
  type: 'reply' | 'closed';
  adminName?: string;
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, customerName, subject, ticketId, message, type, adminName }: EmailRequest = await req.json();

    let emailHtml = '';
    let emailSubject = '';

    if (type === 'reply') {
      emailSubject = `Re: ${subject} - Support Ticket #${ticketId.slice(-8)}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SmartHub Computers</h1>
            <p style="color: white; margin: 5px 0;">Customer Support</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">New Reply to Your Support Ticket</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>Hello ${customerName},</strong></p>
              <p style="margin: 0 0 15px 0;">We have replied to your support ticket regarding: <strong>${subject}</strong></p>
              <p style="margin: 0 0 10px 0;"><strong>Ticket ID:</strong> #${ticketId.slice(-8)}</p>
            </div>

            ${message ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Reply from ${adminName || 'Support Team'}:</h3>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 3px solid #28a745;">
                <p style="margin: 0; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
            ` : ''}

            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
              <p style="margin: 0 0 15px 0;">You can continue the conversation by replying to this email or using our live chat.</p>
              <a href="https://smarthubcomputers.lovable.app" 
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Visit Our Website
              </a>
            </div>
          </div>

          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0 0 10px 0;"><strong>SmartHub Computers</strong></p>
            <p style="margin: 0;">Koinange Street, Uniafric House Room 208, Nairobi, Kenya</p>
            <p style="margin: 5px 0;">Phone: 0704144239 | Email: smarthub278@gmail.com</p>
          </div>
        </div>
      `;
    } else if (type === 'closed') {
      emailSubject = `Ticket Closed: ${subject} - Support Ticket #${ticketId.slice(-8)}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">SmartHub Computers</h1>
            <p style="color: white; margin: 5px 0;">Customer Support</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Support Ticket Closed</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>Hello ${customerName},</strong></p>
              <p style="margin: 0 0 15px 0;">Your support ticket has been resolved and closed.</p>
              <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 0 0 10px 0;"><strong>Ticket ID:</strong> #${ticketId.slice(-8)}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Thank you for choosing SmartHub Computers!</h3>
              <p style="margin: 0 0 15px 0; line-height: 1.6;">
                We hope we were able to resolve your issue satisfactorily. If you need further assistance or have any other questions, please don't hesitate to contact us.
              </p>
              <p style="margin: 0; line-height: 1.6;">
                Your feedback is valuable to us. If you'd like to share your experience, please feel free to reach out.
              </p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
              <p style="margin: 0 0 15px 0;">Need help with something else?</p>
              <a href="https://smarthubcomputers.lovable.app" 
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Visit Our Website
              </a>
            </div>
          </div>

          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0 0 10px 0;"><strong>SmartHub Computers</strong></p>
            <p style="margin: 0;">Koinange Street, Uniafric House Room 208, Nairobi, Kenya</p>
            <p style="margin: 5px 0;">Phone: 0704144239 | Email: smarthub278@gmail.com</p>
          </div>
        </div>
      `;
    }

    const { error } = await resend.emails.send({
      from: 'SmartHub Support <support@smarthubcomputers.lovable.app>',
      to: [to],
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-ticket-email function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});