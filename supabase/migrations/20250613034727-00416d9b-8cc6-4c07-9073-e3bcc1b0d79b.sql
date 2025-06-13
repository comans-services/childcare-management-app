
-- First, let's check and create only the missing triggers
-- Use IF NOT EXISTS approach by checking pg_trigger system table

-- Check and create timesheet_entries deletion trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'timesheet_entries_deletion_audit') THEN
        CREATE TRIGGER timesheet_entries_deletion_audit
          BEFORE DELETE ON public.timesheet_entries
          FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();
    END IF;
END
$$;

-- Check and create projects deletion trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'projects_deletion_audit') THEN
        CREATE TRIGGER projects_deletion_audit
          BEFORE DELETE ON public.projects
          FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();
    END IF;
END
$$;

-- Check and create contracts deletion trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'contracts_deletion_audit') THEN
        CREATE TRIGGER contracts_deletion_audit
          BEFORE DELETE ON public.contracts
          FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();
    END IF;
END
$$;

-- Check and create project_assignments deletion trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'project_assignments_deletion_audit') THEN
        CREATE TRIGGER project_assignments_deletion_audit
          BEFORE DELETE ON public.project_assignments
          FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();
    END IF;
END
$$;

-- Check and create contract_assignments deletion trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'contract_assignments_deletion_audit') THEN
        CREATE TRIGGER contract_assignments_deletion_audit
          BEFORE DELETE ON public.contract_assignments
          FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();
    END IF;
END
$$;

-- Create a specialized function for assignment logging
CREATE OR REPLACE FUNCTION public.log_assignment_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_display_name text;
  entity_name_val text;
  description_val text;
  assigned_user_name text;
  details_val jsonb;
BEGIN
  -- Get user display name
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = auth.uid();

  -- Handle different assignment types
  IF TG_TABLE_NAME = 'project_assignments' THEN
    -- Get project name for context
    SELECT p.name INTO entity_name_val FROM projects p WHERE p.id = NEW.project_id;
    SELECT COALESCE(pr.full_name, pr.email, 'Unknown User') INTO assigned_user_name
    FROM profiles pr WHERE pr.id = NEW.user_id;
    
    description_val := 'Assigned ' || assigned_user_name || ' to project: ' || entity_name_val;
    details_val := jsonb_build_object(
      'project_id', NEW.project_id,
      'project_name', entity_name_val,
      'assigned_user_id', NEW.user_id,
      'assigned_user_name', assigned_user_name,
      'assigned_by', NEW.assigned_by
    );
    
  ELSIF TG_TABLE_NAME = 'contract_assignments' THEN
    -- Get contract name for context
    SELECT c.name INTO entity_name_val FROM contracts c WHERE c.id = NEW.contract_id;
    SELECT COALESCE(pr.full_name, pr.email, 'Unknown User') INTO assigned_user_name
    FROM profiles pr WHERE pr.id = NEW.user_id;
    
    description_val := 'Assigned ' || assigned_user_name || ' to contract: ' || entity_name_val;
    details_val := jsonb_build_object(
      'contract_id', NEW.contract_id,
      'contract_name', entity_name_val,
      'assigned_user_id', NEW.user_id,
      'assigned_user_name', assigned_user_name,
      'assigned_by', NEW.assigned_by
    );
    
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    action,
    entity_name,
    description,
    details
  ) VALUES (
    COALESCE(NEW.assigned_by, auth.uid()),
    user_display_name,
    'user_assigned',
    entity_name_val,
    description_val,
    details_val
  );

  RETURN NEW;
END;
$$;

-- Check and create project_assignments insert trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'project_assignments_insert_audit') THEN
        CREATE TRIGGER project_assignments_insert_audit
          AFTER INSERT ON public.project_assignments
          FOR EACH ROW EXECUTE FUNCTION public.log_assignment_audit();
    END IF;
END
$$;

-- Check and create contract_assignments insert trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'contract_assignments_insert_audit') THEN
        CREATE TRIGGER contract_assignments_insert_audit
          AFTER INSERT ON public.contract_assignments
          FOR EACH ROW EXECUTE FUNCTION public.log_assignment_audit();
    END IF;
END
$$;

-- Update the fetch function to use audit_logs directly instead of the complex union query
CREATE OR REPLACE FUNCTION public.get_audit_logs_direct(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id text,
  user_id uuid,
  user_name text,
  action text,
  entity_name text,
  description text,
  details jsonb,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'audit_' || al.id::text as id,
    al.user_id,
    al.user_name,
    al.action,
    al.entity_name,
    al.description,
    al.details,
    al.created_at
  FROM audit_logs al
  WHERE (p_start_date IS NULL OR al.created_at::date >= p_start_date)
    AND (p_end_date IS NULL OR al.created_at::date <= p_end_date)
    AND (p_user_id IS NULL OR al.user_id = p_user_id)
  ORDER BY al.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_assignment_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_audit_logs_direct TO authenticated;
