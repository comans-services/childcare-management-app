
import { logAuditEvent } from "@/lib/audit/audit-service";

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: 'budget_override' | 'entry_created' | 'entry_updated' | 'entry_deleted';
  entity_type: 'timesheet_entry' | 'project';
  entity_id: string;
  entity_name?: string;
  description: string;
  details: Record<string, any>;
  created_at?: string;
}

/**
 * Get project name for audit logging
 */
const getProjectName = async (projectId: string): Promise<string> => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single();
  
  return project?.name || 'Unknown Project';
};

/**
 * Log budget override event with detailed description
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
  try {
    console.log("=== LOGGING BUDGET OVERRIDE EVENT ===", { userId, projectId, entryId, details });
    
    const projectName = await getProjectName(projectId);
    const description = `Overrode budget limit for ${projectName} (added ${details.hoursAdded} hours, ${details.excessHours} hours over ${details.totalBudget}h budget)`;
    
    await logAuditEvent({
      user_id: userId,
      action: 'budget_override',
      entity_type: 'timesheet_entry',
      entity_id: entryId,
      entity_name: projectName,
      description: description,
      details: {
        project_id: projectId,
        project_name: projectName,
        ...details,
        timestamp: new Date().toISOString()
      }
    });
    
    console.log("Budget override audit event logged successfully");
  } catch (error) {
    console.error("Error in logBudgetOverride:", error);
    // Don't throw here - audit logging should not break the main flow
  }
};

/**
 * Log timesheet entry event with descriptive details
 */
export const logEntryEvent = async (
  userId: string,
  action: 'entry_created' | 'entry_updated' | 'entry_deleted',
  entryId: string,
  details: Record<string, any>
): Promise<void> => {
  try {
    console.log("=== LOGGING TIMESHEET ENTRY EVENT ===", { userId, action, entryId, details });
    
    let entityName = 'Timesheet Entry';
    let description = '';
    
    // Get project name if available
    if (details.project_id) {
      entityName = await getProjectName(details.project_id);
    }
    
    // Generate descriptive text based on action
    switch (action) {
      case 'entry_created':
        description = `Created timesheet entry for ${entityName}`;
        if (details.hours_logged) {
          description += ` (${details.hours_logged} hours on ${details.entry_date})`;
        }
        break;
      case 'entry_updated':
        description = `Updated timesheet entry for ${entityName}`;
        if (details.hours_logged) {
          description += ` (${details.hours_logged} hours on ${details.entry_date})`;
        }
        break;
      case 'entry_deleted':
        description = `Deleted timesheet entry for ${entityName}`;
        break;
    }

    await logAuditEvent({
      user_id: userId,
      action,
      entity_type: 'timesheet_entry',
      entity_id: entryId,
      entity_name: entityName,
      description: description,
      details: {
        ...details,
        project_name: entityName !== 'Timesheet Entry' ? entityName : undefined,
        timestamp: new Date().toISOString()
      }
    });
    
    console.log("Timesheet entry audit event logged successfully:", description);
  } catch (error) {
    console.error("Error in logEntryEvent:", error);
    // Don't throw here - audit logging should not break the main flow
  }
};
