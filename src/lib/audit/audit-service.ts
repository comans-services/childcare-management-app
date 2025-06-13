
import { supabase } from "@/integrations/supabase/client";

/**
 * Log report generation to audit trail using the secure database function
 */
export const logReportGeneration = async (params: {
  reportType: string;
  filters: Record<string, any>;
  resultCount: number;
}): Promise<void> => {
  try {
    console.log("Logging report generation to audit trail:", params);
    
    const { error } = await supabase.rpc('log_report_generation_secure', {
      p_report_type: params.reportType,
      p_filters: params.filters,
      p_result_count: params.resultCount
    });

    if (error) {
      console.error("Error logging report generation:", error);
      throw error;
    }

    console.log("Report generation logged successfully to audit trail");
  } catch (error) {
    console.error("Error in logReportGeneration:", error);
    throw error;
  }
};

/**
 * Re-export the fetchAuditLogs function from the existing fetch service
 */
export { fetchAuditLogs } from "./fetch-service";
