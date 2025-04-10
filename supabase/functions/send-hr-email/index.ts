
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface HRIssueRequest {
  userEmail: string;
  userName: string;
  issueDescription: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, issueDescription }: HRIssueRequest = await req.json();

    if (!userEmail || !issueDescription) {
      throw new Error("Missing required fields");
    }

    const emailResponse = await resend.emails.send({
      from: "Timesheet System <onboarding@resend.dev>",
      to: ["belinda.comeau@comansservices.com.au"],
      subject: "Timesheet System - HR Issue Report",
      html: `
        <h1>Timesheet HR Issue Report</h1>
        <h2>Issue Details:</h2>
        <p><strong>Reported by:</strong> ${userName} (${userEmail})</p>
        <p><strong>Date Submitted:</strong> ${new Date().toLocaleString()}</p>
        <hr />
        <h3>Issue Description:</h3>
        <p>${issueDescription.replace(/\n/g, "<br />")}</p>
        <hr />
        <p><i>This is an automated message from the Timesheet System. Please respond directly to the user's email address if needed.</i></p>
      `,
      reply_to: userEmail,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-hr-email function:", error);
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
