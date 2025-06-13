
-- Step 1: Secure the audit_logs table with explicit restrictive policies
-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Users can view their own audit logs or admins can view all" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create restrictive policies that prevent any deletion or modification
CREATE POLICY "Users can view their own audit logs or admins can view all" ON public.audit_logs
FOR SELECT USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() = 'admin'
);

-- Allow only system/authenticated users to insert audit logs
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Explicitly deny all UPDATE operations on audit logs to preserve integrity
CREATE POLICY "Deny all updates to audit logs" ON public.audit_logs
FOR UPDATE USING (false);

-- Explicitly deny all DELETE operations on audit logs to preserve integrity  
CREATE POLICY "Deny all deletions of audit logs" ON public.audit_logs
FOR DELETE USING (false);

-- Step 2: Check and create triggers for team member management (profiles table) only if they don't exist
DO $$
BEGIN
    -- Check and create profiles insert trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_insert_audit') THEN
        CREATE TRIGGER profiles_insert_audit
          AFTER INSERT ON public.profiles
          FOR EACH ROW EXECUTE FUNCTION public.log_insert_audit();
    END IF;

    -- Check and create profiles update trigger  
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_update_audit') THEN
        CREATE TRIGGER profiles_update_audit
          AFTER UPDATE ON public.profiles
          FOR EACH ROW EXECUTE FUNCTION public.log_update_audit();
    END IF;

    -- Check and create profiles deletion trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_deletion_audit') THEN
        CREATE TRIGGER profiles_deletion_audit
          BEFORE DELETE ON public.profiles
          FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();
    END IF;
END
$$;

-- Step 3: Create database function for secure report generation logging
CREATE OR REPLACE FUNCTION public.log_report_generation_secure(
  p_report_type text,
  p_filters jsonb,
  p_result_count integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_display_name text;
  entity_name_val text;
  description_val text;
BEGIN
  -- Get user display name
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = auth.uid();

  -- Format description based on report type and filters
  IF p_report_type = 'timesheet' THEN
    entity_name_val := 'Timesheet Report';
    description_val := 'Generated timesheet report (' || p_result_count || ' entries)';
    
    -- Add filter details to description
    IF p_filters ? 'userId' AND (p_filters->>'userId') IS NOT NULL THEN
      description_val := description_val || ' - filtered by user';
    END IF;
    IF p_filters ? 'projectId' AND (p_filters->>'projectId') IS NOT NULL THEN
      description_val := description_val || ' - filtered by project';
    END IF;
    IF p_filters ? 'customerId' AND (p_filters->>'customerId') IS NOT NULL THEN
      description_val := description_val || ' - filtered by customer';
    END IF;
    IF p_filters ? 'contractId' AND (p_filters->>'contractId') IS NOT NULL THEN
      description_val := description_val || ' - filtered by contract';
    END IF;
  ELSE
    entity_name_val := 'Audit Report';
    description_val := 'Generated audit report (' || p_result_count || ' log entries)';
    
    IF p_filters ? 'actionType' AND (p_filters->>'actionType') IS NOT NULL THEN
      description_val := description_val || ' - filtered by action: ' || (p_filters->>'actionType');
    END IF;
    IF p_filters ? 'userId' AND (p_filters->>'userId') IS NOT NULL THEN
      description_val := description_val || ' - filtered by user';
    END IF;
  END IF;

  -- Insert audit log entry
  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    action,
    entity_name,
    description,
    details
  ) VALUES (
    auth.uid(),
    user_display_name,
    CASE WHEN p_report_type = 'timesheet' THEN 'report_generated' ELSE 'audit_report_generated' END,
    entity_name_val,
    description_val,
    jsonb_build_object(
      'report_type', p_report_type,
      'result_count', p_result_count,
      'filters', p_filters
    )
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_report_generation_secure TO authenticated;
