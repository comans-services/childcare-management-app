
import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: 'budget_override' | 'entry_created' | 'entry_updated' | 'entry_deleted';
  entity_type: 'timesheet_entry' | 'project';
  entity_id: string;
  details: Record<string, any>;
  created_at?: string;
}

/**
 * Log an audit event
 */
export const logAuditEvent = async (entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<void> => {
  try {
    console.log("=== LOGGING AUDIT EVENT ===", entry);
    
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: entry.user_id,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        details: entry.details,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("Error logging audit event:", error);
      // Don't throw here - audit logging should not break the main flow
    } else {
      console.log("Audit event logged successfully");
    }
  } catch (error) {
    console.error("Error in logAuditEvent:", error);
    // Don't throw here - audit logging should not break the main flow
  }
};

/**
 * Log budget override event
 */
export const logBudgetOverride = async (
  userId: string,
  projectId: string,
  entryId: string,
  details: {
    hoursAdded: number;
    totalBudget: number;
    hoursUsedBefore: number;
    hoursUsedAfter: number;
    excessHours: number;
  }
): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action: 'budget_override',
    entity_type: 'timesheet_entry',
    entity_id: entryId,
    details: {
      project_id: projectId,
      ...details,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Log timesheet entry event
 */
export const logEntryEvent = async (
  userId: string,
  action: 'entry_created' | 'entry_updated' | 'entry_deleted',
  entryId: string,
  details: Record<string, any>
): Promise<void> => {
  await logAuditEvent({
    user_id: userId,
    action,
    entity_type: 'timesheet_entry',
    entity_id: entryId,
    details
  });
};
