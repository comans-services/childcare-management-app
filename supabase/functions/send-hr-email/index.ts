import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: string;
  data: any;
}

interface HRIssueRequest {
  userEmail: string;
  userName: string;
  issueDescription: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('HR Email function called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Handle legacy HR issue format
    if (body.userEmail && body.issueDescription) {
      return handleHRIssue(body as HRIssueRequest);
    }

    // Handle new leave management emails
    const { type, data }: EmailRequest = body;
    console.log('Email type:', type);

    let emailContent, subject, recipients = [];

    switch (type) {
      case 'new_leave_application':
        subject = `New Leave Application from ${data.applicant_name}`;
        recipients = ["belinda.comeau@comansservices.com.au"];
        emailContent = `<h1>New Leave Application</h1><p>From: ${data.applicant_name}</p><p>Type: ${data.leave_type}</p><p>Dates: ${data.start_date} to ${data.end_date}</p>`;
        break;

      case 'leave_decision':
        subject = `Leave Application ${data.status}`;
        recipients = [data.applicant_email];
        emailContent = `<h1>Leave Application ${data.status}</h1><p>Your leave application has been ${data.status}</p>`;
        break;

      case 'balance_update':
        subject = 'Leave Balance Updated';
        recipients = [data.user_email];
        emailContent = `<h1>Leave Balance Update</h1><p>Hello ${data.user_name}, your leave balances have been updated.</p>`;
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const emailResponse = await resend.emails.send({
      from: "HR System <onboarding@resend.dev>",
      to: recipients,
      subject: subject,
      html: emailContent,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-hr-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function handleHRIssue(data: HRIssueRequest): Promise<Response> {
  const emailResponse = await resend.emails.send({
    from: "Timesheet System <onboarding@resend.dev>",
    to: ["belinda.comeau@comansservices.com.au"],
    subject: "Timesheet System - HR Issue Report",
    html: `
      <h1>Timesheet HR Issue Report</h1>
      <p><strong>Reported by:</strong> ${data.userName} (${data.userEmail})</p>
      <p><strong>Issue:</strong> ${data.issueDescription}</p>
    `,
    reply_to: data.userEmail,
  });

  return new Response(JSON.stringify(emailResponse), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(handler);