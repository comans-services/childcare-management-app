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
    const { email, redirectTo } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate a password recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: redirectTo || `${APP_BASE_URL}/reset-password`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Error generating recovery link:", linkError);
      // Return success anyway to avoid email enumeration
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetLink = linkData.properties.action_link;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Reset Your Password</h1>
          <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: left;">
            <p style="font-size: 16px; margin-bottom: 15px;">Hello,</p>
            <p style="font-size: 16px; margin-bottom: 15px;">
              We received a request to reset your DACCC Timesheet password.
              Click the button below to set a new password:
            </p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetLink}"
                 style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                ⚠️ This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
            <div style="background-color: #f0f9ff; padding: 12px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #0369a1;">
                📧 Can't see the button? Check your <strong>spam or junk folder</strong>, or copy this link into your browser:<br>
                <span style="font-size: 11px; word-break: break-all; color: #2563eb;">${resetLink}</span>
              </p>
            </div>
          </div>
          <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
            <p>DACCC Timesheet System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: "DACCC Timesheet <notifications@daccc.org.au>",
      to: [email],
      subject: "Reset your DACCC Timesheet password",
      html: emailHtml,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset-email:", error);
    // Return success to avoid email enumeration
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
