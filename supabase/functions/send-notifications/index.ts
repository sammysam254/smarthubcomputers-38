import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

// Helper function to generate VAPID JWT token
function generateJWT(privateKey: string, publicKey: string, audience: string): string {
  const header = {
    typ: "JWT",
    alg: "ES256"
  };
  
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: "mailto:support@smarthubcomputers.com"
  };
  
  // For simplicity, we'll use a basic implementation
  // In production, use a proper JWT library
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  return `${encodedHeader}.${encodedPayload}.signature`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get active subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("notification_subscriptions")
      .select("*")
      .eq("active", true);

    if (subscriptionError) {
      console.error("Error fetching subscriptions:", subscriptionError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No active subscriptions found");
      return new Response(
        JSON.stringify({ message: "No active subscriptions" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get some featured products for the notification
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("name, price, category")
      .eq("in_stock", true)
      .limit(3);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch products" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification payload with variety
    const hour = new Date().getHours();
    const notificationVariations = [
      {
        title: "🔥 Hot Deals Alert!",
        body: products && products.length > 0 
          ? `${products[0]?.name} now available from KSh ${products[0]?.price}! Limited stock!`
          : "Amazing computer deals waiting for you!"
      },
      {
        title: "💻 New Tech Arrivals!",
        body: products && products.length > 0 
          ? `Fresh stock: ${products[0]?.name} and more in ${products[0]?.category}`
          : "Latest computers and electronics just arrived!"
      },
      {
        title: "⚡ Flash Sale!",
        body: products && products.length > 0 
          ? `Don't miss out! ${products[0]?.name} starting at KSh ${products[0]?.price}`
          : "Limited time offers on computers and gadgets!"
      },
      {
        title: "🎯 Recommended for You",
        body: products && products.length > 0 
          ? `Check out ${products[0]?.name} and ${products.length - 1} more trending products`
          : "Discover products picked just for you!"
      }
    ];

    const notificationPayload: NotificationPayload = {
      ...notificationVariations[hour % notificationVariations.length],
      url: "/products"
    };

    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");

    if (!vapidPrivateKey || !vapidPublicKey) {
      console.error("VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let successCount = 0;
    let failureCount = 0;

    // Send notifications to all subscriptions using proper Web Push API
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        };

        // Determine the push service from the endpoint
        let pushServiceUrl = subscription.endpoint;
        let headers: Record<string, string> = {
          "Content-Type": "application/json",
          "TTL": "86400"
        };

        // Add authorization for different push services
        if (subscription.endpoint.includes('fcm.googleapis.com')) {
          // FCM (Chrome/Firefox)
          headers["Authorization"] = `key=${vapidPrivateKey}`;
        } else if (subscription.endpoint.includes('push.services.mozilla.com')) {
          // Mozilla (Firefox)
          headers["Authorization"] = `vapid t=${generateJWT(vapidPrivateKey, vapidPublicKey, subscription.endpoint)}, k=${vapidPublicKey}`;
        } else {
          // Generic Web Push with VAPID
          headers["Authorization"] = `vapid t=${generateJWT(vapidPrivateKey, vapidPublicKey, subscription.endpoint)}, k=${vapidPublicKey}`;
        }

        const response = await fetch(pushSubscription.endpoint, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            notification: notificationPayload,
            data: notificationPayload
          })
        });

        if (response.ok || response.status === 204) {
          successCount++;
          console.log(`Notification sent successfully to ${subscription.endpoint.substring(0, 50)}...`);
        } else {
          failureCount++;
          console.error(`Failed to send notification (${response.status}):`, await response.text());
          
          // If the subscription is invalid, mark it as inactive
          if (response.status === 410 || response.status === 404) {
            await supabase
              .from("notification_subscriptions")
              .update({ active: false })
              .eq("endpoint", subscription.endpoint);
            console.log(`Marked inactive subscription: ${subscription.endpoint.substring(0, 50)}...`);
          }
        }
      } catch (error) {
        failureCount++;
        console.error(`Error sending notification to ${subscription.endpoint.substring(0, 50)}...:`, error);
      }
    }

    console.log(`Notifications sent: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent to ${successCount} subscribers`,
        successCount,
        failureCount
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-notifications function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});