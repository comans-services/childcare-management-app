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

interface LogAuditEventParams {
  action: string;
  details?: Record<string, any>;
}

/**
 * Log an audit event with current user context
 * This is the centralized audit logging function for all application activities
 */
export const logAuditEvent = async ({ action, details = {} }: LogAuditEventParams): Promise<void> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.warn("logAuditEvent: no authenticated user, skipping audit log");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const userName = profile?.full_name || profile?.email || "Unknown User";

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      user_name: userName,
      action,
      details
    });
  } catch (error) {
    console.error("Error logging audit event:", error);
    // Never throw - we don't want logging to break main operations
  }
};
