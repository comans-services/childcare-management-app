
-- Update the action types function to include report generation actions
CREATE OR REPLACE FUNCTION public.get_audit_action_types()
RETURNS text[]
LANGUAGE sql
STABLE
AS $$
  SELECT ARRAY[
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
$$;
