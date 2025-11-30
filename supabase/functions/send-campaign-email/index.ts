import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email Configuration
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

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

    // Fetch email settings from database
    const { data: emailSettings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error("Email settings fetch error:", settingsError);
    }

    // Use email settings or fallback to defaults
    const FROM_NAME = emailSettings?.sender_name || 'DACCC';
    const FROM_EMAIL = emailSettings?.sender_email || 'onboarding@resend.dev';
    const REPLY_TO_EMAIL = emailSettings?.reply_to_email || FROM_EMAIL;
    
    console.log(`Email settings: From: ${FROM_NAME} <${FROM_EMAIL}>, Reply-To: ${REPLY_TO_EMAIL}`);

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

    // Check Resend API key
    if (!RESEND_API_KEY) {
      console.error("Resend API key not configured");
      return new Response(
        JSON.stringify({ 
          error: "Resend API key not configured. Please add RESEND_API_KEY secret." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Resend client
    const resend = new Resend(RESEND_API_KEY);
    console.log("Resend client initialized");

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

          // Send email via Resend
          const { data, error } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: contact.email,
            reply_to: REPLY_TO_EMAIL, // Enable replies to go to configured address
            subject: campaign.subject,
            html: emailHtml,
          });

          if (error) {
            throw error;
          }

          console.log(`✓ Sent to ${contact.email} - ID: ${data?.id}`);

          // Log success event
          await supabase.from("campaign_events").insert({
            campaign_id: campaign.id,
            contact_id: contact.id !== "test-contact" ? contact.id : null,
            contact_email: contact.email,
            event_type: testMode ? "test_sent" : "sent",
            event_timestamp: new Date().toISOString(),
            provider_response: { id: data?.id },
          });

          sentCount++;
          return { success: true, email: contact.email };
        } catch (error: any) {
          console.error(`✗ Failed to send to ${contact.email}:`, error.message);

          // Determine if it's a bounce or general failure
          const isBounce = error.message?.includes("bounce") || error.statusCode === 550;
          
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
            provider_response: { error: error.message, statusCode: error.statusCode },
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

// Generate simple HTML email template (simplified for notifications)
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
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
          
          <!-- Simple Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px 40px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; color: #111827; font-weight: 600;">${subject}</h1>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Dear ${recipientName},
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <div style="font-size: 16px; line-height: 1.8; color: #374151;">
                ${messageBody}
              </div>
            </td>
          </tr>
          
          ${includeFooter ? `
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Best regards,<br>
                <strong>DACCC</strong>
              </p>
              
              ${unsubscribeLink ? `
              <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                <a href="${unsubscribeLink}" style="color: #6b7280; text-decoration: underline;">
                  Unsubscribe from these emails
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
