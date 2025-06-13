
import { supabase } from "@/integrations/supabase/client";

/**
 * Get all possible action types for filtering - now includes report generation actions
 */
export const getAuditActionTypes = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase.rpc('get_audit_action_types');
    
    if (error) {
      console.error("Error fetching action types:", error);
      // Return comprehensive fallback list if function fails
      return getFallbackActionTypes();
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getAuditActionTypes:", error);
    // Return comprehensive fallback list if there's an error
    return getFallbackActionTypes();
  }
};

const getFallbackActionTypes = (): string[] => {
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
    'member_deleted',
    'report_generated',
    'audit_report_generated'
  ];
};
