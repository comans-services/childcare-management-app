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
 * Fetch audit logs using the new database function approach
 */
export const fetchAuditLogs = async (filters: AuditFilters): Promise<AuditLogEntry[]> => {
  console.log("Fetching audit logs with filters:", filters);
  
  try {
    const { data, error } = await supabase.rpc('get_user_activities', {
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
      entity_type: item.entity_type,
      entity_id: null, // Not directly available from our function
      entity_name: item.entity_name,
      description: item.description,
      details: item.details,
      ip_address: null, // Not tracked in this approach
      user_agent: null, // Not tracked in this approach
      created_at: item.created_at
    }));

    // Apply frontend filters for action type and entity type
    if (filters.actionType) {
      transformedData = transformedData.filter(item => 
        item.action.toLowerCase().includes(filters.actionType!.toLowerCase())
      );
    }

    if (filters.entityType) {
      transformedData = transformedData.filter(item => 
        item.entity_type === filters.entityType
      );
    }

    console.log("Filtered audit logs:", transformedData.length, "records");
    return transformedData;
  } catch (error) {
    console.error("Error in fetchAuditLogs:", error);
    throw error;
  }
};

/**
 * Get unique action types for filtering - derived from known actions
 */
export const getAuditActionTypes = async (): Promise<string[]> => {
  // Return known action types from our database function
  return [
    'entry_created',
    'entry_updated', 
    'project_created',
    'project_updated',
    'user_assigned'
  ];
};

/**
 * Get unique entity types for filtering - derived from known entity types
 */
export const getAuditEntityTypes = async (): Promise<string[]> => {
  // Return known entity types from our database function
  return [
    'timesheet_entry',
    'project'
  ];
};

// Legacy function - no longer needed but kept for compatibility
export const logAuditEvent = async (entry: {
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  description?: string;
  details?: Record<string, any>;
}): Promise<void> => {
  // This function is no longer needed since we're using existing tables
  // for audit tracking, but keeping it for backward compatibility
  console.log("Legacy audit logging - no action needed:", entry);
};
