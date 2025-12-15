import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://example.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  fullName: string;
  temporaryPassword?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: WelcomeEmailRequest = await req.json();
    console.log("Processing welcome email for:", requestData.email);
    console.log("Using APP_BASE_URL:", APP_BASE_URL);

    const loginUrl = `${APP_BASE_URL}/auth`;
    const timesheetUrl = `${APP_BASE_URL}/timesheet`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to the Team!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">🎉 Welcome to the Team!</h1>
          
          <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: left;">
            <p style="font-size: 16px; margin-bottom: 15px;">Hello ${requestData.fullName},</p>
            
            <p style="font-size: 16px; margin-bottom: 15px;">
              Your account has been created and you're all set to start using the Timesheet System.
            </p>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">
                📧 Your Login Details:
              </p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${requestData.email}</p>
              ${requestData.temporaryPassword ? `
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${requestData.temporaryPassword}</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #1e40af;">
                  ⚠️ Please change your password after your first login.
                </p>
              ` : `
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #1e40af;">
                  Use the password you were given by your administrator.
                </p>
              `}
            </div>
            
            <p style="font-size: 16px; margin-bottom: 15px;">
              With the Timesheet System, you can:
            </p>
            
            <ul style="font-size: 16px; margin-bottom: 15px; padding-left: 20px;">
              <li>Log your daily working hours</li>
              <li>Submit leave applications</li>
              <li>View your work schedule</li>
              <li>Track your timesheet history</li>
            </ul>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
                Login Now
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              If you have any questions, please contact your manager or HR department.
            </p>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
            <p>This is an automated welcome email from your Timesheet System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Timesheet System <onboarding@resend.dev>",
      to: [requestData.email],
      subject: `Welcome to the Team, ${requestData.fullName}!`,
      html: emailHtml,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
