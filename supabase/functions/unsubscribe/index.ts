import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== UNSUBSCRIBE REQUEST ===");
    
    // Extract token from URL query params
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    
    console.log("Token received:", token ? "Yes" : "No");
    
    if (!token) {
      console.error("No token provided");
      return errorPage("Invalid unsubscribe link. Please contact support.");
    }

    // Decode token
    let decoded: string;
    try {
      decoded = atob(token); // campaignId:email:timestamp
      console.log("Token decoded successfully");
    } catch (e) {
      console.error("Failed to decode token:", e);
      return errorPage("Invalid token format. Please contact support.");
    }

    const [campaignId, email, timestamp] = decoded.split(":");
    
    console.log("Parsed data:", { campaignId, email: email ? "present" : "missing", timestamp });
    
    // Validate
    if (!campaignId || !email || !timestamp) {
      console.error("Invalid token format - missing parts");
      return errorPage("Invalid unsubscribe link format. Please contact support.");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return errorPage("Invalid email address in token.");
    }

    // Check token age (90 days max)
    const tokenAge = Date.now() - parseInt(timestamp);
    const MAX_AGE = 90 * 24 * 60 * 60 * 1000; // 90 days
    if (tokenAge > MAX_AGE) {
      console.error("Token expired. Age:", tokenAge, "Max:", MAX_AGE);
      return errorPage("This unsubscribe link has expired. Please contact support.");
    }

    console.log("Token age valid:", Math.floor(tokenAge / (24 * 60 * 60 * 1000)), "days");

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials");
      throw new Error("Server configuration error");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if already unsubscribed
    console.log("Checking if already unsubscribed:", email);
    const { data: existing, error: checkError } = await supabase
      .from("unsubscribes")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing unsubscribe:", checkError);
      throw checkError;
    }

    if (existing) {
      console.log("Email already unsubscribed");
      return alreadyUnsubscribedPage(email);
    }

    console.log("Processing new unsubscribe for:", email);

    // Process unsubscribe
    // 1. Add to unsubscribes table
    const { error: unsubError } = await supabase
      .from("unsubscribes")
      .insert({
        email,
        campaign_id: campaignId,
        unsubscribe_source: "email_link",
        unsubscribed_at: new Date().toISOString(),
      });

    if (unsubError) {
      console.error("Error inserting unsubscribe:", unsubError);
      throw unsubError;
    }
    console.log("✓ Added to unsubscribes table");

    // 2. Update contact email_consent
    const { error: contactError } = await supabase
      .from("contacts")
      .update({ email_consent: false, updated_at: new Date().toISOString() })
      .eq("email", email);

    if (contactError) {
      console.error("Error updating contact:", contactError);
      // Continue anyway - the unsubscribe record was created
    } else {
      console.log("✓ Updated contact email_consent to false");
    }

    // 3. Log event
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    const { error: eventError } = await supabase.from("campaign_events").insert({
      campaign_id: campaignId,
      contact_id: contact?.id,
      contact_email: email,
      event_type: "unsubscribed",
      event_timestamp: new Date().toISOString(),
      unsubscribed_at: new Date().toISOString(),
    });

    if (eventError) {
      console.error("Error logging event:", eventError);
      // Continue anyway
    } else {
      console.log("✓ Logged unsubscribe event");
    }

    // 4. Increment campaign unsubscribe count
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("total_unsubscribed")
      .eq("id", campaignId)
      .maybeSingle();

    if (campaign) {
      const { error: campaignError } = await supabase
        .from("campaigns")
        .update({ 
          total_unsubscribed: (campaign.total_unsubscribed || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", campaignId);

      if (campaignError) {
        console.error("Error updating campaign:", campaignError);
      } else {
        console.log("✓ Incremented campaign total_unsubscribed");
      }
    }

    console.log("=== UNSUBSCRIBE SUCCESSFUL ===");
    return successPage(email);

  } catch (error: any) {
    console.error("=== UNSUBSCRIBE ERROR ===");
    console.error("Error details:", error);
    return errorPage("An error occurred while processing your request. Please try again or contact support.");
  }
};

// Success page
function successPage(email: string): Response {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed Successfully</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            margin: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }
          .container { 
            background: white; 
            padding: 40px; 
            border-radius: 16px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
            text-align: center; 
            max-width: 500px;
            width: 100%;
          }
          .icon { 
            width: 64px; 
            height: 64px; 
            background: #10b981; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin: 0 auto 20px;
            font-size: 32px;
            color: white;
          }
          h1 { 
            color: #1f2937; 
            margin-bottom: 16px; 
            font-size: 28px;
            font-weight: 600;
          }
          p { 
            color: #6b7280; 
            line-height: 1.6; 
            margin-bottom: 12px;
            font-size: 16px;
          }
          .email { 
            font-weight: 600; 
            color: #667eea; 
            word-break: break-word;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✓</div>
          <h1>Unsubscribed Successfully</h1>
          <p>The email address <span class="email">${email}</span> has been removed from our mailing list.</p>
          <p>You will no longer receive marketing emails from us.</p>
          <div class="footer">
            If this was a mistake, please contact our support team.
          </div>
        </div>
      </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}

// Already unsubscribed page
function alreadyUnsubscribedPage(email: string): Response {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Already Unsubscribed</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            margin: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }
          .container { 
            background: white; 
            padding: 40px; 
            border-radius: 16px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
            text-align: center; 
            max-width: 500px;
            width: 100%;
          }
          .icon { 
            width: 64px; 
            height: 64px; 
            background: #3b82f6; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin: 0 auto 20px;
            font-size: 32px;
            color: white;
          }
          h1 { 
            color: #1f2937; 
            margin-bottom: 16px; 
            font-size: 28px;
            font-weight: 600;
          }
          p { 
            color: #6b7280; 
            line-height: 1.6; 
            margin-bottom: 12px;
            font-size: 16px;
          }
          .email { 
            font-weight: 600; 
            color: #3b82f6;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">ℹ</div>
          <h1>Already Unsubscribed</h1>
          <p>The email address <span class="email">${email}</span> was already unsubscribed from our mailing list.</p>
          <p>You won't receive any further marketing emails from us.</p>
        </div>
      </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}

// Error page
function errorPage(message: string): Response {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            margin: 0; 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 20px;
          }
          .container { 
            background: white; 
            padding: 40px; 
            border-radius: 16px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
            text-align: center; 
            max-width: 500px;
            width: 100%;
          }
          .icon { 
            width: 64px; 
            height: 64px; 
            background: #ef4444; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin: 0 auto 20px;
            font-size: 32px;
            color: white;
          }
          h1 { 
            color: #ef4444; 
            margin-bottom: 16px; 
            font-size: 28px;
            font-weight: 600;
          }
          p { 
            color: #6b7280; 
            line-height: 1.6;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">⚠</div>
          <h1>Error</h1>
          <p>${message}</p>
        </div>
      </body>
    </html>
  `;
  
  return new Response(html, {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}

serve(handler);
