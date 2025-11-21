import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Denv.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all campaigns that are scheduled and due to be sent
    const now = new Date().toISOString();
    const { data: campaigns, error: fetchError } = await supabaseClient
      .from("campaigns")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    if (fetchError) {
      console.error("Error fetching scheduled campaigns:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${campaigns?.length || 0} campaigns to process`);

    const results = [];

    for (const campaign of campaigns || []) {
      try {
        // Update status to sending
        await supabaseClient
          .from("campaigns")
          .update({ status: "sending" })
          .eq("id", campaign.id);

        // Call the send-campaign-email function
        const { data, error } = await supabaseClient.functions.invoke(
          "send-campaign-email",
          {
            body: { campaignId: campaign.id },
          }
        );

        if (error) {
          console.error(`Error sending campaign ${campaign.id}:`, error);
          // Update status back to scheduled with error
          await supabaseClient
            .from("campaigns")
            .update({ status: "scheduled" })
            .eq("id", campaign.id);
          
          results.push({
            campaignId: campaign.id,
            success: false,
            error: error.message,
          });
        } else {
          results.push({
            campaignId: campaign.id,
            success: true,
          });
        }
      } catch (error) {
        console.error(`Error processing campaign ${campaign.id}:`, error);
        results.push({
          campaignId: campaign.id,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in process-scheduled-campaigns:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
