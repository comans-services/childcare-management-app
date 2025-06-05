
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Testing email templates...');

    const testEmail = 'chinh@comansservices.com.au';
    const templates = ['friday', 'monday', 'monthly'] as const;
    
    const emailPromises = templates.map(async (templateType) => {
      try {
        // Call the main timesheet reminder function for each template
        const { data, error } = await supabase.functions.invoke('send-timesheet-reminders', {
          body: {
            templateType,
            recipientEmails: [testEmail]
          }
        });

        if (error) {
          console.error(`Error sending ${templateType} template:`, error);
          return { template: templateType, success: false, error: error.message };
        }

        console.log(`${templateType} template sent successfully:`, data);
        return { template: templateType, success: true, data };
      } catch (emailError: any) {
        console.error(`Failed to send ${templateType} template:`, emailError);
        return { template: templateType, success: false, error: emailError.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(result => result.success).length;
    const failureCount = results.filter(result => !result.success).length;

    console.log(`Template testing completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email template testing completed`,
        emailsSent: successCount,
        emailsFailed: failureCount,
        results: results,
        testEmail: testEmail
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in test-email-templates function:', error);
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

serve(serve_handler);
