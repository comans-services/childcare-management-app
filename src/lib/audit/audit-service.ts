// Audit service - uses audit_logs table
import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  id: string;
  action: string;
  user_name?: string;
  created_at: string;
  details?: any;
}

export const fetchAuditLogs = async (filters?: any): Promise<AuditLogEntry[]> => {
  try {
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filters?.actionType) {
      query = query.ilike("action", `%${filters.actionType}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
};
