import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://example.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: "userId and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role key to generate a password-recovery magic link
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${APP_BASE_URL}/reset-password`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Error generating recovery link:", linkError);
      return new Response(
        JSON.stringify({ error: linkError?.message || "Failed to generate recovery link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetLink = linkData.properties.action_link;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Reactivated</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Account Reactivated</h1>

          <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: left;">
            <p style="font-size: 16px; margin-bottom: 15px;">Hello,</p>

            <p style="font-size: 16px; margin-bottom: 15px;">
              Your DACCC Timesheet account has been <strong>reactivated</strong> by an administrator.
            </p>

            <p style="font-size: 16px; margin-bottom: 15px;">
              To regain access, please set a new password by clicking the button below:
            </p>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetLink}"
                 style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Set New Password
              </a>
            </div>

            <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                ⚠️ This link will expire in <strong>24 hours</strong>. If you did not expect this email, please contact your administrator.
              </p>
            </div>

            <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #92400e;">
                Can't see the button? Check your <strong>spam or junk folder</strong>, or copy this link into your browser:<br>
                <span style="font-size: 11px; word-break: break-all;">${resetLink}</span>
              </p>
            </div>

            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              If you have any questions, please contact your manager or HR department.
            </p>
          </div>

          <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
            <p>DACCC Timesheet System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Timesheet System <onboarding@resend.dev>",
      to: [email],
      subject: "Your DACCC Timesheet account has been reactivated",
      html: emailHtml,
    });

    console.log("Reactivation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-reactivation-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
