import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SMTP Configuration - Placeholders for Azure SMTP
const SMTP_HOST = Deno.env.get("AZURE_SMTP_HOST") || "smtp-hve.office365.com";
const SMTP_PORT = parseInt(Deno.env.get("AZURE_SMTP_PORT") || "587");
const SMTP_USER = Deno.env.get("AZURE_SMTP_USERNAME") || "";
const SMTP_PASS = Deno.env.get("AZURE_SMTP_PASSWORD") || "";
const FROM_EMAIL = SMTP_USER || "no-reply@yourdomain.com";
const FROM_NAME = "Mass Mailer System";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CampaignEmailRequest {
  campaignId: string;
  testMode?: boolean;
  testEmail?: string;
}

interface Contact {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface Campaign {
  id: string;
  subject: string;
  message_body: string;
  message_format: string;
  audience_filter: string;
  target_tag: string | null;
  created_by: string;
  footer_included: boolean;
  unsubscribe_link_included: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Send Campaign Email Function Started ===");

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const { campaignId, testMode = false, testEmail }: CampaignEmailRequest = await req.json();

    console.log(`Campaign ID: ${campaignId}, Test Mode: ${testMode}`);

    // Validate campaignId
    if (!campaignId || typeof campaignId !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid campaignId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error("Campaign fetch error:", campaignError);
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Campaign found: ${campaign.subject}`);

    // Get recipients
    let recipients: Contact[] = [];

    if (testMode && testEmail) {
      // Test mode: send to test email only
      recipients = [{
        id: "test-contact",
        email: testEmail,
        full_name: "Test Recipient",
        first_name: "Test",
        last_name: "Recipient"
      }];
      console.log(`Test mode: sending to ${testEmail}`);
    } else {
      // Live mode: fetch contacts based on audience filter
      let query = supabase
        .from("contacts")
        .select("id, email, full_name, first_name, last_name")
        .eq("is_active", true)
        .eq("email_consent", true);

      // Apply audience filter
      if (campaign.audience_filter === "tags" && campaign.target_tag) {
        query = query.contains("tags", [campaign.target_tag]);
      }

      const { data: contacts, error: contactsError } = await query;

      if (contactsError) {
        console.error("Contacts fetch error:", contactsError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch contacts" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      recipients = contacts || [];
      console.log(`Found ${recipients.length} eligible recipients`);
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No eligible recipients found",
          campaign_id: campaignId,
          total_recipients: 0,
          sent: 0,
          failed: 0,
          bounced: 0
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check SMTP credentials
    if (!SMTP_USER || !SMTP_PASS) {
      console.error("SMTP credentials not configured");
      return new Response(
        JSON.stringify({ 
          error: "SMTP credentials not configured. Please add AZURE_SMTP_USERNAME and AZURE_SMTP_PASSWORD secrets." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Configure SMTP transporter
    console.log(`Configuring SMTP: ${SMTP_HOST}:${SMTP_PORT}`);
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false, // Use STARTTLS for port 587
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: true,
      },
    });

    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log("SMTP connection verified");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
      return new Response(
        JSON.stringify({ 
          error: "SMTP authentication failed. Please check your Azure SMTP credentials.",
          details: verifyError.message
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update campaign status to 'sending' (if not test mode)
    if (!testMode) {
      await supabase
        .from("campaigns")
        .update({ 
          status: "sending",
          total_recipients: recipients.length
        })
        .eq("id", campaignId);
    }

    // Send emails in batches
    const BATCH_SIZE = 50;
    const BATCH_DELAY_MS = 1000; // 1 second between batches

    let sentCount = 0;
    let failedCount = 0;
    let bouncedCount = 0;
    const errors: Array<{ email: string; error: string }> = [];

    console.log(`Starting to send ${recipients.length} emails in batches of ${BATCH_SIZE}`);

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} emails`);

      const batchPromises = batch.map(async (contact) => {
        try {
          // Generate unsubscribe token
          const unsubToken = btoa(`${campaign.id}:${contact.email}:${Date.now()}`);
          const unsubLink = `${SUPABASE_URL}/functions/v1/unsubscribe?token=${unsubToken}`;

          // Determine recipient name
          const recipientName = contact.full_name || 
            (contact.first_name && contact.last_name 
              ? `${contact.first_name} ${contact.last_name}` 
              : contact.first_name || contact.last_name || "Valued Contact");

          // Generate email HTML
          const emailHtml = generateEmailTemplate(
            campaign.subject,
            campaign.message_body,
            recipientName,
            campaign.footer_included,
            campaign.unsubscribe_link_included ? unsubLink : null
          );

          // Send email
          const info = await transporter.sendMail({
            from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
            to: contact.email,
            subject: campaign.subject,
            html: emailHtml,
            text: campaign.message_body.replace(/<[^>]*>/g, ""), // Strip HTML for plain text
          });

          console.log(`✓ Sent to ${contact.email} - Message ID: ${info.messageId}`);

          // Log success event
          await supabase.from("campaign_events").insert({
            campaign_id: campaign.id,
            contact_id: contact.id !== "test-contact" ? contact.id : null,
            contact_email: contact.email,
            event_type: testMode ? "test_sent" : "sent",
            event_timestamp: new Date().toISOString(),
            provider_response: { messageId: info.messageId, response: info.response },
          });

          sentCount++;
          return { success: true, email: contact.email };
        } catch (error: any) {
          console.error(`✗ Failed to send to ${contact.email}:`, error.message);

          // Determine if it's a bounce or general failure
          const isBounce = error.responseCode >= 500 || error.message.includes("bounce");
          
          if (isBounce) {
            bouncedCount++;
          } else {
            failedCount++;
          }

          errors.push({ email: contact.email, error: error.message });

          // Log failure event
          await supabase.from("campaign_events").insert({
            campaign_id: campaign.id,
            contact_id: contact.id !== "test-contact" ? contact.id : null,
            contact_email: contact.email,
            event_type: isBounce ? "bounced" : "failed",
            event_timestamp: new Date().toISOString(),
            bounce_type: isBounce ? "hard" : null,
            bounce_reason: error.message,
            provider_response: { error: error.message, code: error.code },
          });

          return { success: false, email: contact.email, error: error.message };
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);

      // Delay between batches (except for last batch)
      if (i + BATCH_SIZE < recipients.length) {
        console.log(`Waiting ${BATCH_DELAY_MS}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    console.log(`=== Email sending complete ===`);
    console.log(`Sent: ${sentCount}, Failed: ${failedCount}, Bounced: ${bouncedCount}`);

    // Update campaign statistics
    if (testMode) {
      // Test mode: update test fields only
      await supabase
        .from("campaigns")
        .update({
          test_sent_to: testEmail,
          test_sent_at: new Date().toISOString(),
        })
        .eq("id", campaignId);
    } else {
      // Live mode: update full statistics
      const finalStatus = sentCount > 0 ? "completed" : "failed";
      
      await supabase
        .from("campaigns")
        .update({
          total_sent: sentCount,
          total_bounced: bouncedCount,
          sent_at: new Date().toISOString(),
          sent_by: campaign.created_by,
          status: finalStatus,
        })
        .eq("id", campaignId);
    }

    // Return response
    return new Response(
      JSON.stringify({
        success: sentCount > 0,
        campaign_id: campaignId,
        test_mode: testMode,
        total_recipients: recipients.length,
        sent: sentCount,
        failed: failedCount,
        bounced: bouncedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Unexpected error in send-campaign-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

// Generate HTML email template
function generateEmailTemplate(
  subject: string,
  messageBody: string,
  recipientName: string,
  includeFooter: boolean,
  unsubscribeLink: string | null
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 700;">${subject}</h1>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <p style="margin: 0; font-size: 18px; color: #333333; line-height: 1.6;">
                Dear ${recipientName},
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <div style="font-size: 16px; line-height: 1.8; color: #555555;">
                ${messageBody}
              </div>
            </td>
          </tr>
          
          ${includeFooter ? `
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px 40px; border-top: 2px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6c757d; line-height: 1.6;">
                <strong>Mass Mailer System</strong><br>
                This email was sent to you as part of our communication.
              </p>
              
              ${unsubscribeLink ? `
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #adb5bd; line-height: 1.5;">
                Don't want to receive these emails? 
                <a href="${unsubscribeLink}" style="color: #667eea; text-decoration: underline;">
                  Click here to unsubscribe
                </a>
              </p>
              ` : ''}
            </td>
          </tr>
          ` : ''}
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

serve(handler);
