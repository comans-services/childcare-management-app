
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderRequest {
  templateType: 'friday' | 'monday' | 'monthly' | 'monthly-morning' | 'monthly-evening';
  recipientEmails?: string[]; // Optional: specific emails to send to
  weekStartDate?: string; // Optional: specific week (defaults to current week)
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const serve_handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { templateType, recipientEmails, weekStartDate }: ReminderRequest = await req.json();

    console.log(`Processing ${templateType} timesheet reminder request`);

    // Check if this is a monthly reminder and if it's actually the last day of the month
    if (templateType.startsWith('monthly')) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      // Check if tomorrow is the first day of next month (meaning today is last day of current month)
      const isLastDayOfMonth = tomorrow.getDate() === 1;
      
      if (!isLastDayOfMonth) {
        console.log('Not the last day of the month, skipping monthly reminder');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Skipped - not the last day of the month',
            emailsSent: 0
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    }

    let usersToRemind;

    if (recipientEmails && recipientEmails.length > 0) {
      // Send to specific recipients (generic emails)
      console.log(`Sending generic ${templateType} reminders to specified recipients`);
      usersToRemind = recipientEmails.map(email => ({
        email,
        full_name: 'Team Member',
        organization: '',
        missing_days: 0,
        expected_days: 0,
        logged_days: 0
      }));
    } else {
      // Query database for users with missing timesheet entries
      console.log('Querying database for users with missing timesheet entries');
      
      const { data: missingUsers, error: dbError } = await supabase
        .rpc('get_users_missing_timesheet_entries', {
          p_week_start_date: weekStartDate || null
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database query failed: ${dbError.message}`);
      }

      usersToRemind = missingUsers || [];
      console.log(`Found ${usersToRemind.length} users with missing timesheet entries`);

      // For evening monthly reminders, only send if users still have missing entries
      if (templateType === 'monthly-evening' && usersToRemind.length === 0) {
        console.log('No users with missing entries for evening reminder, skipping');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'No users require evening timesheet reminders - all timesheets complete',
            emailsSent: 0
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
    }

    if (usersToRemind.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users require timesheet reminders at this time',
          emailsSent: 0
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Generate email content based on template type
    const emailContent = getEmailTemplate(templateType);
    
    // Send emails
    const emailPromises = usersToRemind.map(async (user: any) => {
      try {
        const emailResponse = await resend.emails.send({
          from: "Timesheet System <timesheet@yourdomain.com>",
          to: [user.email],
          subject: emailContent.subject,
          html: emailContent.html,
        });

        console.log(`Email sent successfully to ${user.email}:`, emailResponse);
        return { email: user.email, success: true, id: emailResponse.id };
      } catch (emailError: any) {
        console.error(`Failed to send email to ${user.email}:`, emailError);
        return { email: user.email, success: false, error: emailError.message };
      }
    });

    const emailResults = await Promise.all(emailPromises);
    const successCount = emailResults.filter(result => result.success).length;
    const failureCount = emailResults.filter(result => !result.success).length;

    console.log(`Email sending completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${templateType} timesheet reminders processed`,
        emailsSent: successCount,
        emailsFailed: failureCount,
        results: emailResults
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send-timesheet-reminders function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

function getEmailTemplate(templateType: 'friday' | 'monday' | 'monthly' | 'monthly-morning' | 'monthly-evening') {
  const templates = {
    friday: {
      subject: "Weekend Reminder: Complete Your Timesheet",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Weekend Timesheet Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">🎉 Week's End Timesheet Reminder</h1>
            
            <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <p style="font-size: 16px; margin-bottom: 15px;">Hello!</p>
              
              <p style="font-size: 16px; margin-bottom: 15px;">
                As we wrap up another productive week, it's time to ensure your timesheet is complete and accurate.
              </p>
              
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-weight: bold; color: #92400e;">
                  ⏰ Please review and submit your timesheet before you log off for the weekend.
                </p>
              </div>
              
              <p style="font-size: 16px; margin-bottom: 15px;">
                Taking a few minutes now will help ensure accurate payroll processing and project tracking.
              </p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="#" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Complete My Timesheet
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                Have a wonderful weekend! 🌟
              </p>
            </div>
            
            <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
              <p>This is an automated reminder from your Timesheet System</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    monday: {
      subject: "Week Start Reminder: Update Your Timesheet",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Monday Timesheet Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #059669; margin-bottom: 20px;">☀️ Monday Timesheet Check-In</h1>
            
            <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <p style="font-size: 16px; margin-bottom: 15px;">Good Monday morning!</p>
              
              <p style="font-size: 16px; margin-bottom: 15px;">
                As we start a fresh new week, let's make sure your timesheet from last week is complete and ready for processing.
              </p>
              
              <div style="background-color: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #059669;">
                <p style="margin: 0; font-weight: bold; color: #047857;">
                  📝 Please take a moment to review and finalize your previous week's entries.
                </p>
              </div>
              
              <p style="font-size: 16px; margin-bottom: 15px;">
                Starting the week with an organized timesheet helps maintain accurate records and ensures smooth project management.
              </p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="#" style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Review My Timesheet
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                Here's to a productive week ahead! 💪
              </p>
            </div>
            
            <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
              <p>This is an automated reminder from your Timesheet System</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    'monthly': {
      subject: "Monthly Timesheet Review Required",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Monthly Timesheet Review</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #7c3aed; margin-bottom: 20px;">📊 Monthly Timesheet Review</h1>
            
            <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <p style="font-size: 16px; margin-bottom: 15px;">Hello Team Member,</p>
              
              <p style="font-size: 16px; margin-bottom: 15px;">
                As we close out another month, it's time for our comprehensive timesheet review to ensure all entries are accurate and complete.
              </p>
              
              <div style="background-color: #ede9fe; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #7c3aed;">
                <p style="margin: 0; font-weight: bold; color: #5b21b6;">
                  📅 Please review your entire month's timesheet entries for accuracy and completeness.
                </p>
              </div>
              
              <p style="font-size: 16px; margin-bottom: 15px;">
                This monthly review helps ensure:
              </p>
              
              <ul style="font-size: 16px; margin-bottom: 15px; padding-left: 20px;">
                <li>Accurate project time allocation</li>
                <li>Proper billing and payroll processing</li>
                <li>Compliance with company policies</li>
                <li>Better project planning for the upcoming month</li>
              </ul>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="#" style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Review Monthly Timesheet
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                Thank you for your attention to detail and commitment to accurate time tracking! 🎯
              </p>
            </div>
            
            <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
              <p>This is an automated monthly reminder from your Timesheet System</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    'monthly-morning': {
      subject: "Monthly Timesheet Review Required - Morning Reminder",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Monthly Timesheet Review - Morning</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #7c3aed; margin-bottom: 20px;">🌅 Monthly Timesheet Review - Morning Reminder</h1>
            
            <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <p style="font-size: 16px; margin-bottom: 15px;">Good morning!</p>
              
              <p style="font-size: 16px; margin-bottom: 15px;">
                Today is the last day of the month, and it's time for our comprehensive timesheet review to ensure all entries are accurate and complete.
              </p>
              
              <div style="background-color: #ede9fe; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #7c3aed;">
                <p style="margin: 0; font-weight: bold; color: #5b21b6;">
                  📅 Please review your entire month's timesheet entries for accuracy and completeness before the end of today.
                </p>
              </div>
              
              <p style="font-size: 16px; margin-bottom: 15px;">
                This monthly review helps ensure:
              </p>
              
              <ul style="font-size: 16px; margin-bottom: 15px; padding-left: 20px;">
                <li>Accurate project time allocation</li>
                <li>Proper billing and payroll processing</li>
                <li>Compliance with company policies</li>
                <li>Better project planning for the upcoming month</li>
              </ul>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="#" style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Review Monthly Timesheet
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                Complete your review today to avoid any delays in processing. Thank you! 🎯
              </p>
            </div>
            
            <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
              <p>This is an automated monthly reminder from your Timesheet System</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    'monthly-evening': {
      subject: "URGENT: Monthly Timesheet Review - Final Reminder",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Monthly Timesheet Review - Final Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #dc2626; margin-bottom: 20px;">⚠️ URGENT: Monthly Timesheet Review - Final Reminder</h1>
            
            <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <p style="font-size: 16px; margin-bottom: 15px;">URGENT REMINDER</p>
              
              <p style="font-size: 16px; margin-bottom: 15px;">
                This is the <strong>final reminder</strong> for your monthly timesheet review. Today is the last day of the month, and your timesheet entries are still incomplete.
              </p>
              
              <div style="background-color: #fee2e2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p style="margin: 0; font-weight: bold; color: #991b1b;">
                  🚨 ACTION REQUIRED: Please complete your monthly timesheet review immediately to avoid processing delays.
                </p>
              </div>
              
              <p style="font-size: 16px; margin-bottom: 15px;">
                Incomplete timesheets can affect:
              </p>
              
              <ul style="font-size: 16px; margin-bottom: 15px; padding-left: 20px;">
                <li><strong>Payroll processing</strong> - Delays in payment</li>
                <li><strong>Project billing</strong> - Inaccurate client invoicing</li>
                <li><strong>Compliance</strong> - Company policy violations</li>
                <li><strong>Team planning</strong> - Resource allocation issues</li>
              </ul>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="#" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  COMPLETE TIMESHEET NOW
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                If you need assistance, please contact your manager or HR immediately. ⏰
              </p>
            </div>
            
            <div style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
              <p>This is an automated final reminder from your Timesheet System</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  };

  return templates[templateType] || templates.monthly;
}

serve(serve_handler);
