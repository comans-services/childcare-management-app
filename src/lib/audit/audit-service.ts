
import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_name: string | null;
  description: string;
  details: Record<string, any> | null;
  created_at: string;
}

export interface AuditFilters {
  startDate: Date;
  endDate: Date;
  userId?: string;
  actionType?: string;
}

/**
 * Fetch audit logs using the database function approach
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

/**
 * Get all possible action types for filtering - now includes all tracked actions including team member actions
 */
export const getAuditActionTypes = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase.rpc('get_audit_action_types');
    
    if (error) {
      console.error("Error fetching action types:", error);
      // Return comprehensive fallback list if function fails
      return [
        'entry_created',
        'entry_updated', 
        'entry_deleted',
        'project_created',
        'project_updated',
        'project_deleted',
        'contract_created',
        'contract_updated',
        'contract_deleted',
        'user_assigned',
        'user_unassigned',
        'member_created',
        'member_updated',
        'member_deleted'
      ];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getAuditActionTypes:", error);
    // Return comprehensive fallback list if there's an error
    return [
      'entry_created',
      'entry_updated', 
      'entry_deleted',
      'project_created',
      'project_updated',
      'project_deleted',
      'contract_created',
      'contract_updated',
      'contract_deleted',
      'user_assigned',
      'user_unassigned',
      'member_created',
      'member_updated',
      'member_deleted'
    ];
  }
};

// Legacy function - no longer needed but kept for compatibility
export const logAuditEvent = async (entry: {
  user_id: string;
  action: string;
  entity_name?: string;
  description?: string;
  details?: Record<string, any>;
}): Promise<void> => {
  // This function is no longer needed since we're using database triggers
  // for comprehensive audit tracking, but keeping it for backward compatibility
  console.log("Legacy audit logging - handled by comprehensive database triggers:", entry);
};
