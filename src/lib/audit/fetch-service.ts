
import { supabase } from "@/integrations/supabase/client";
import { AuditLogEntry, AuditFilters } from "./types";

/**
 * Fetch audit logs using the new direct database function approach
 */
export const fetchAuditLogs = async (filters: AuditFilters): Promise<AuditLogEntry[]> => {
  console.log("Fetching audit logs with filters:", filters);
  
  try {
    const { data, error } = await supabase.rpc('get_audit_logs_direct', {
      p_start_date: filters.startDate.toISOString().split('T')[0],
      p_end_date: filters.endDate.toISOString().split('T')[0],
      p_user_id: filters.userId || null
    });

    if (error) {
      console.error("Error fetching audit logs:", error);
      throw error;
    }

    console.log("Raw audit data received:", data?.length || 0, "records");

    // Transform the data to match our interface and apply additional filters
    let transformedData = (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      user_name: item.user_name,
      action: item.action,
      entity_name: item.entity_name,
      description: item.description,
      details: item.details,
      created_at: item.created_at
    }));

    // Apply frontend filter for action type
    if (filters.actionType) {
      transformedData = transformedData.filter(item => 
        item.action === filters.actionType
      );
    }

    console.log("Filtered audit logs:", transformedData.length, "records");
    return transformedData;
  } catch (error) {
    console.error("Error in fetchAuditLogs:", error);
    throw error;
  }
};
