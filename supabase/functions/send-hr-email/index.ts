import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();

    // Handle legacy HR issue format
    if (body.userEmail && body.issueDescription) {
      return handleHRIssue(body as HRIssueRequest);
    }

    // Handle new leave management emails
    const { type, data }: EmailRequest = body;
    console.log('Email type:', type);

    // Get admin emails for notifications
    const { data: admins, error: adminError } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('role', 'admin');

    if (adminError) {
      console.error('Error fetching admin emails:', adminError);
      throw new Error('Failed to fetch admin emails');
    }

    const adminEmails = admins?.map(admin => admin.email).filter(Boolean) || [];
    console.log('Admin emails found:', adminEmails.length);

    let emailContent, subject, recipients = [];

    switch (type) {
      case 'new_leave_application':
        subject = `New Leave Application from ${data.applicant_name}`;
        recipients = adminEmails;
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="color: #333; margin: 0;">New Leave Application</h1>
            </div>
            <div style="padding: 20px 0;">
              <h2 style="color: #333;">Application Details</h2>
              <div style="background: #f8f9fa; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p><strong>Employee:</strong> ${data.applicant_name}</p>
                <p><strong>Leave Type:</strong> ${data.leave_type}</p>
                <p><strong>Start Date:</strong> ${data.start_date}</p>
                <p><strong>End Date:</strong> ${data.end_date}</p>
                <p><strong>Duration:</strong> ${data.business_days_count || 'TBD'} business days</p>
                ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
              </div>
              <p>Please log in to the system to review and approve/reject this leave application.</p>
            </div>
            <div style="border-top: 1px solid #ddd; padding-top: 16px; margin-top: 24px; color: #666; font-size: 14px;">
              <p>This is an automated message from your leave management system.</p>
            </div>
          </div>
        `;
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
  // Get admin emails for HR issues
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: admins } = await supabaseClient
    .from('profiles')
    .select('email, full_name')
    .eq('role', 'admin');

  const adminEmails = admins?.map(admin => admin.email).filter(Boolean) || ['belinda.comeau@comansservices.com.au'];

  const emailResponse = await resend.emails.send({
    from: "Timesheet System <onboarding@resend.dev>",
    to: adminEmails,
    subject: "Timesheet System - HR Issue Report",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #333; margin: 0;">Timesheet HR Issue Report</h1>
        </div>
        <div style="padding: 20px 0;">
          <div style="background: #f8f9fa; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p><strong>Reported by:</strong> ${data.userName} (${data.userEmail})</p>
            <p><strong>Issue:</strong> ${data.issueDescription}</p>
          </div>
        </div>
        <div style="border-top: 1px solid #ddd; padding-top: 16px; margin-top: 24px; color: #666; font-size: 14px;">
          <p>This is an automated message from your timesheet system.</p>
        </div>
      </div>
    `,
    reply_to: data.userEmail,
  });

  return new Response(JSON.stringify(emailResponse), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(handler);