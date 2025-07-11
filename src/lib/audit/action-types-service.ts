
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
    'audit_report_generated',
    // Leave application actions
    'leave_application_created',
    'leave_application_updated',
    'leave_application_cancelled',
    'leave_application_approved',
    'leave_application_rejected',
    // Leave balance actions
    'leave_balance_created',
    'leave_balance_updated',
    'leave_balance_deleted',
    // Holiday permission actions
    'holiday_permission_granted',
    'holiday_permission_revoked',
    'holiday_permission_updated',
    // Custom holiday actions
    'custom_holiday_created',
    'custom_holiday_updated',
    'custom_holiday_deleted',
    // Document actions
    'document_uploaded',
    'document_deleted'
  ];
};
