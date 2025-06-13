import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditFilters {
  startDate: Date;
  endDate: Date;
  userId?: string;
  actionType?: string;
  entityType?: string;
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
 * Generate human-readable descriptions for audit events
 */
const generateDescription = (action: string, entityType: string, entityName?: string, details?: Record<string, any>): string => {
  const entity = entityName || entityType.replace('_', ' ');
  
  switch (action.toLowerCase()) {
    case 'entry_created':
      return `Created timesheet entry for ${entity}${details?.hours_logged ? ` (${details.hours_logged} hours)` : ''}`;
    case 'entry_updated':
      return `Updated timesheet entry for ${entity}${details?.hours_logged ? ` (${details.hours_logged} hours)` : ''}`;
    case 'entry_deleted':
      return `Deleted timesheet entry for ${entity}`;
    case 'budget_override':
      return `Overrode budget limit for ${entity}${details?.excessHours ? ` (${details.excessHours} hours over budget)` : ''}`;
    case 'project_created':
      return `Created project: ${entity}`;
    case 'project_updated':
      return `Updated project: ${entity}`;
    case 'project_deleted':
      return `Deleted project: ${entity}`;
    case 'user_created':
      return `Created user account for ${entity}`;
    case 'user_updated':
      return `Updated user profile for ${entity}`;
    case 'login':
      return `User logged in`;
    case 'logout':
      return `User logged out`;
    default:
      return `Performed ${action} on ${entity}`;
  }
};

/**
 * Fetch audit logs with filters
 */
export const fetchAuditLogs = async (filters: AuditFilters): Promise<AuditLogEntry[]> => {
  console.log("Fetching audit logs with filters:", filters);
  
  let query = supabase
    .from('audit_logs')
    .select('*')
    .gte('created_at', filters.startDate.toISOString())
    .lte('created_at', filters.endDate.toISOString())
    .order('created_at', { ascending: false });

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.actionType) {
    query = query.eq('action', filters.actionType);
  }

  if (filters.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }

  return data || [];
};

/**
 * Log an audit event with proper description and user name
 */
export const logAuditEvent = async (entry: {
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  description?: string;
  details?: Record<string, any>;
}): Promise<void> => {
  try {
    console.log("Logging audit event:", entry);
    
    // Get user display name
    const userDisplayName = await getUserDisplayName(entry.user_id);
    
    // Generate description if not provided
    const description = entry.description || generateDescription(
      entry.action, 
      entry.entity_type, 
      entry.entity_name, 
      entry.details
    );

    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: entry.user_id,
        user_name: userDisplayName,
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id || null,
        entity_name: entry.entity_name || null,
        description: description,
        details: entry.details || null,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error("Error logging audit event:", error);
      // Don't throw here - audit logging should not break the main flow
    } else {
      console.log("Audit event logged successfully:", description);
    }
  } catch (error) {
    console.error("Error in logAuditEvent:", error);
    // Don't throw here - audit logging should not break the main flow
  }
};

/**
 * Get unique action types for filtering
 */
export const getAuditActionTypes = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action')
    .order('action');

  if (error) {
    console.error("Error fetching action types:", error);
    return [];
  }

  // Get unique values
  const uniqueActions = [...new Set(data?.map(item => item.action) || [])];
  return uniqueActions;
};

/**
 * Get unique entity types for filtering
 */
export const getAuditEntityTypes = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('entity_type')
    .order('entity_type');

  if (error) {
    console.error("Error fetching entity types:", error);
    return [];
  }

  // Get unique values
  const uniqueEntityTypes = [...new Set(data?.map(item => item.entity_type) || [])];
  return uniqueEntityTypes;
};
