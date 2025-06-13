
import { supabase } from "@/integrations/supabase/client";

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
 * Get user display name for audit logging
 */
const getUserDisplayName = async (userId: string): Promise<string> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .single();
  
  return profile?.full_name || profile?.email || 'Unknown User';
};

/**
 * Get project name for audit logging
 */
const getProjectName = async (projectId: string): Promise<string> => {
  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single();
  
  return project?.name || 'Unknown Project';
};

/**
 * Log an audit event with proper description
 */
export const logAuditEvent = async (entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<void> => {
  try {
    console.log("=== LOGGING TIMESHEET AUDIT EVENT ===", entry);
    
    // Get user display name
    const userDisplayName = await getUserDisplayName(entry.user_id);
    
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: entry.user_id,
        user_name: userDisplayName,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        entity_name: entry.entity_name || null,
        description: entry.description,
        details: entry.details,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("Error logging timesheet audit event:", error);
      // Don't throw here - audit logging should not break the main flow
    } else {
      console.log("Timesheet audit event logged successfully:", entry.description);
    }
  } catch (error) {
    console.error("Error in timesheet logAuditEvent:", error);
    // Don't throw here - audit logging should not break the main flow
  }
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
};
