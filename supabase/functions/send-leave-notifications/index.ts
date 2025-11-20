import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeaveNotificationRequest {
  type: 'new_application' | 'application_decision' | 'balance_update' | 'carry_over_complete';
  applicationId?: string;
  userId?: string;
  leaveTypeName?: string;
  startDate?: string;
  endDate?: string;
  businessDays?: number;
  decision?: 'approved' | 'rejected';
  managerComments?: string;
  balanceChange?: number;
  newBalance?: number;
  year?: number;
  carriedOverDays?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestData: LeaveNotificationRequest = await req.json();
    console.log("Processing leave notification:", requestData);

    let emailData: { to: string[]; subject: string; html: string } | null = null;

    switch (requestData.type) {
      case 'new_application': {
        // Fetch admins
        const { data: admins } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('role', 'admin')
          .eq('is_active', true);

        if (!admins || admins.length === 0) {
          throw new Error('No active administrators found');
        }

        // Fetch applicant details
        const { data: applicant } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', requestData.userId!)
          .single();

        emailData = {
          to: admins.map(admin => admin.email),
          subject: `New Leave Application - ${applicant?.full_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">New Leave Application</h2>
              <p><strong>${applicant?.full_name}</strong> has submitted a new leave application.</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${requestData.leaveTypeName}</p>
                <p style="margin: 5px 0;"><strong>Start Date:</strong> ${requestData.startDate}</p>
                <p style="margin: 5px 0;"><strong>End Date:</strong> ${requestData.endDate}</p>
                <p style="margin: 5px 0;"><strong>Business Days:</strong> ${requestData.businessDays}</p>
              </div>
              
              <p>Please review and process this application in the Leave Management system.</p>
            </div>
          `,
        };
        break;
      }

      case 'application_decision': {
        // Fetch applicant details
        const { data: applicant } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', requestData.userId!)
          .single();

        if (!applicant) {
          throw new Error('Applicant not found');
        }

        const isApproved = requestData.decision === 'approved';
        emailData = {
          to: [applicant.email],
          subject: `Leave Application ${isApproved ? 'Approved' : 'Rejected'} - ${requestData.leaveTypeName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: ${isApproved ? '#10b981' : '#ef4444'};">
                Leave Application ${isApproved ? 'Approved' : 'Rejected'}
              </h2>
              <p>Dear ${applicant.full_name},</p>
              
              <p>Your leave application has been <strong>${requestData.decision}</strong>.</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${requestData.leaveTypeName}</p>
                <p style="margin: 5px 0;"><strong>Start Date:</strong> ${requestData.startDate}</p>
                <p style="margin: 5px 0;"><strong>End Date:</strong> ${requestData.endDate}</p>
                <p style="margin: 5px 0;"><strong>Business Days:</strong> ${requestData.businessDays}</p>
              </div>
              
              ${requestData.managerComments ? `
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Manager Comments:</strong></p>
                  <p style="margin: 10px 0 0 0;">${requestData.managerComments}</p>
                </div>
              ` : ''}
              
              <p>You can view your leave balance and history in the Leave Management system.</p>
            </div>
          `,
        };
        break;
      }

      case 'balance_update': {
        // Fetch user details
        const { data: user } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', requestData.userId!)
          .single();

        if (!user) {
          throw new Error('User not found');
        }

        emailData = {
          to: [user.email],
          subject: `Leave Balance Updated - ${requestData.leaveTypeName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Leave Balance Updated</h2>
              <p>Dear ${user.full_name},</p>
              
              <p>Your leave balance has been updated.</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${requestData.leaveTypeName}</p>
                <p style="margin: 5px 0;"><strong>Year:</strong> ${requestData.year}</p>
                <p style="margin: 5px 0;"><strong>Balance Change:</strong> ${requestData.balanceChange! > 0 ? '+' : ''}${requestData.balanceChange} days</p>
                <p style="margin: 5px 0;"><strong>New Balance:</strong> ${requestData.newBalance} days</p>
              </div>
              
              <p>You can view your updated balance in the Leave Management system.</p>
            </div>
          `,
        };
        break;
      }

      case 'carry_over_complete': {
        // Fetch user details
        const { data: user } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', requestData.userId!)
          .single();

        if (!user) {
          throw new Error('User not found');
        }

        emailData = {
          to: [user.email],
          subject: `Leave Carry Over Complete - ${requestData.year}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Leave Balance Carried Over</h2>
              <p>Dear ${user.full_name},</p>
              
              <p>Your unused leave balance has been carried over to the new year.</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Leave Type:</strong> ${requestData.leaveTypeName}</p>
                <p style="margin: 5px 0;"><strong>Carried Over:</strong> ${requestData.carriedOverDays} days</p>
                <p style="margin: 5px 0;"><strong>New Year:</strong> ${requestData.year}</p>
              </div>
              
              <p>You can view your updated balance in the Leave Management system.</p>
            </div>
          `,
        };
        break;
      }
    }

    if (!emailData) {
      throw new Error('Invalid notification type or missing data');
    }

    console.log("Sending email to:", emailData.to);

    const emailResponse = await resend.emails.send({
      from: "Leave Management <onboarding@resend.dev>",
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-leave-notifications function:", error);
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
