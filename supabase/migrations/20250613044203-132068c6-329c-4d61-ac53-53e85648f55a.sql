
-- First, let's make sure we have all the necessary trigger functions

-- Create INSERT trigger function for comprehensive audit logging
CREATE OR REPLACE FUNCTION public.log_insert_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_display_name text;
  entity_name_val text;
  description_val text;
  details_val jsonb;
BEGIN
  -- Get user display name
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = auth.uid();

  -- Handle different table insertions
  IF TG_TABLE_NAME = 'timesheet_entries' THEN
    -- Get project name for context
    SELECT COALESCE(p.name, c.name, 'Unknown Project/Contract') INTO entity_name_val
    FROM projects p 
    FULL OUTER JOIN contracts c ON c.id = NEW.contract_id
    WHERE p.id = NEW.project_id OR c.id = NEW.contract_id;
    
    description_val := 'Created timesheet entry for ' || entity_name_val || 
                      ' (' || NEW.hours_logged || ' hours on ' || NEW.entry_date || ')';
    details_val := jsonb_build_object(
      'project_id', NEW.project_id,
      'contract_id', NEW.contract_id,
      'hours_logged', NEW.hours_logged,
      'entry_date', NEW.entry_date,
      'entry_type', NEW.entry_type,
      'notes', NEW.notes
    );
    
  ELSIF TG_TABLE_NAME = 'projects' THEN
    entity_name_val := NEW.name;
    description_val := 'Created project: ' || NEW.name;
    details_val := jsonb_build_object(
      'project_name', NEW.name,
      'budget_hours', NEW.budget_hours,
      'customer_id', NEW.customer_id,
      'is_internal', NEW.is_internal
    );
    
  ELSIF TG_TABLE_NAME = 'contracts' THEN
    entity_name_val := NEW.name;
    description_val := 'Created contract: ' || NEW.name;
    details_val := jsonb_build_object(
      'contract_name', NEW.name,
      'customer_id', NEW.customer_id,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date,
      'status', NEW.status
    );
    
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    entity_name_val := COALESCE(NEW.full_name, NEW.email, 'New Team Member');
    description_val := 'Added team member: ' || COALESCE(NEW.full_name, NEW.email, 'Unknown User');
    details_val := jsonb_build_object(
      'user_id', NEW.id,
      'full_name', NEW.full_name,
      'email', NEW.email,
      'role', NEW.role,
      'employment_type', NEW.employment_type,
      'organization', NEW.organization,
      'employee_id', NEW.employee_id,
      'employee_card_id', NEW.employee_card_id
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
    COALESCE(auth.uid(), NEW.user_id, NEW.id),
    user_display_name,
    CASE 
      WHEN TG_TABLE_NAME = 'timesheet_entries' THEN 'entry_created'
      WHEN TG_TABLE_NAME = 'projects' THEN 'project_created'
      WHEN TG_TABLE_NAME = 'contracts' THEN 'contract_created'
      WHEN TG_TABLE_NAME = 'profiles' THEN 'member_created'
    END,
    entity_name_val,
    description_val,
    details_val
  );

  RETURN NEW;
END;
$$;

-- Create UPDATE trigger function for comprehensive audit logging
CREATE OR REPLACE FUNCTION public.log_update_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_display_name text;
  entity_name_val text;
  description_val text;
  details_val jsonb;
BEGIN
  -- Get user display name
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = auth.uid();

  -- Handle different table updates
  IF TG_TABLE_NAME = 'timesheet_entries' THEN
    -- Get project name for context
    SELECT COALESCE(p.name, c.name, 'Unknown Project/Contract') INTO entity_name_val
    FROM projects p 
    FULL OUTER JOIN contracts c ON c.id = NEW.contract_id
    WHERE p.id = NEW.project_id OR c.id = NEW.contract_id;
    
    description_val := 'Updated timesheet entry for ' || entity_name_val || 
                      ' (' || NEW.hours_logged || ' hours on ' || NEW.entry_date || ')';
    details_val := jsonb_build_object(
      'project_id', NEW.project_id,
      'contract_id', NEW.contract_id,
      'hours_logged', NEW.hours_logged,
      'entry_date', NEW.entry_date,
      'entry_type', NEW.entry_type,
      'notes', NEW.notes,
      'old_hours_logged', OLD.hours_logged,
      'old_notes', OLD.notes
    );
    
  ELSIF TG_TABLE_NAME = 'projects' THEN
    entity_name_val := NEW.name;
    description_val := 'Updated project: ' || NEW.name;
    details_val := jsonb_build_object(
      'project_name', NEW.name,
      'budget_hours', NEW.budget_hours,
      'customer_id', NEW.customer_id,
      'is_internal', NEW.is_internal,
      'old_project_name', OLD.name,
      'old_budget_hours', OLD.budget_hours
    );
    
  ELSIF TG_TABLE_NAME = 'contracts' THEN
    entity_name_val := NEW.name;
    description_val := 'Updated contract: ' || NEW.name;
    details_val := jsonb_build_object(
      'contract_name', NEW.name,
      'customer_id', NEW.customer_id,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date,
      'status', NEW.status,
      'old_contract_name', OLD.name,
      'old_status', OLD.status
    );
    
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    entity_name_val := COALESCE(NEW.full_name, NEW.email, 'Team Member');
    description_val := 'Updated team member: ' || COALESCE(NEW.full_name, NEW.email, 'Unknown User');
    details_val := jsonb_build_object(
      'user_id', NEW.id,
      'full_name', NEW.full_name,
      'email', NEW.email,
      'role', NEW.role,
      'employment_type', NEW.employment_type,
      'organization', NEW.organization,
      'employee_id', NEW.employee_id,
      'employee_card_id', NEW.employee_card_id,
      'old_full_name', OLD.full_name,
      'old_role', OLD.role,
      'old_employment_type', OLD.employment_type,
      'old_organization', OLD.organization
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
    COALESCE(auth.uid(), NEW.user_id, NEW.id),
    user_display_name,
    CASE 
      WHEN TG_TABLE_NAME = 'timesheet_entries' THEN 'entry_updated'
      WHEN TG_TABLE_NAME = 'projects' THEN 'project_updated'
      WHEN TG_TABLE_NAME = 'contracts' THEN 'contract_updated'
      WHEN TG_TABLE_NAME = 'profiles' THEN 'member_updated'
    END,
    entity_name_val,
    description_val,
    details_val
  );

  RETURN NEW;
END;
$$;

-- Create DELETE trigger function for comprehensive audit logging
CREATE OR REPLACE FUNCTION public.log_deletion_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_display_name text;
  entity_name_val text;
  description_val text;
  details_val jsonb;
BEGIN
  -- Get user display name
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = auth.uid();

  -- Handle different table deletions
  IF TG_TABLE_NAME = 'timesheet_entries' THEN
    -- Get project name for context
    SELECT COALESCE(p.name, c.name, 'Unknown Project/Contract') INTO entity_name_val
    FROM projects p 
    FULL OUTER JOIN contracts c ON c.id = OLD.contract_id
    WHERE p.id = OLD.project_id OR c.id = OLD.contract_id;
    
    description_val := 'Deleted timesheet entry for ' || entity_name_val || 
                      ' (' || OLD.hours_logged || ' hours on ' || OLD.entry_date || ')';
    details_val := jsonb_build_object(
      'project_id', OLD.project_id,
      'contract_id', OLD.contract_id,
      'hours_logged', OLD.hours_logged,
      'entry_date', OLD.entry_date,
      'entry_type', OLD.entry_type,
      'notes', OLD.notes
    );
    
  ELSIF TG_TABLE_NAME = 'projects' THEN
    entity_name_val := OLD.name;
    description_val := 'Deleted project: ' || OLD.name;
    details_val := jsonb_build_object(
      'project_name', OLD.name,
      'budget_hours', OLD.budget_hours,
      'customer_id', OLD.customer_id,
      'is_internal', OLD.is_internal
    );
    
  ELSIF TG_TABLE_NAME = 'contracts' THEN
    entity_name_val := OLD.name;
    description_val := 'Deleted contract: ' || OLD.name;
    details_val := jsonb_build_object(
      'contract_name', OLD.name,
      'customer_id', OLD.customer_id,
      'start_date', OLD.start_date,
      'end_date', OLD.end_date,
      'status', OLD.status
    );
    
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    entity_name_val := COALESCE(OLD.full_name, OLD.email, 'Team Member');
    description_val := 'Deleted team member: ' || COALESCE(OLD.full_name, OLD.email, 'Unknown User');
    details_val := jsonb_build_object(
      'user_id', OLD.id,
      'full_name', OLD.full_name,
      'email', OLD.email,
      'role', OLD.role,
      'employment_type', OLD.employment_type,
      'organization', OLD.organization,
      'employee_id', OLD.employee_id,
      'employee_card_id', OLD.employee_card_id
    );
    
  ELSIF TG_TABLE_NAME = 'project_assignments' THEN
    -- Get project and user names for context
    SELECT p.name INTO entity_name_val FROM projects p WHERE p.id = OLD.project_id;
    SELECT COALESCE(pr.full_name, pr.email, 'Unknown User') INTO description_val
    FROM profiles pr WHERE pr.id = OLD.user_id;
    
    description_val := 'Unassigned ' || description_val || ' from project: ' || entity_name_val;
    details_val := jsonb_build_object(
      'project_id', OLD.project_id,
      'project_name', entity_name_val,
      'unassigned_user_id', OLD.user_id
    );
    
  ELSIF TG_TABLE_NAME = 'contract_assignments' THEN
    -- Get contract and user names for context
    SELECT c.name INTO entity_name_val FROM contracts c WHERE c.id = OLD.contract_id;
    SELECT COALESCE(pr.full_name, pr.email, 'Unknown User') INTO description_val
    FROM profiles pr WHERE pr.id = OLD.user_id;
    
    description_val := 'Unassigned ' || description_val || ' from contract: ' || entity_name_val;
    details_val := jsonb_build_object(
      'contract_id', OLD.contract_id,
      'contract_name', entity_name_val,
      'unassigned_user_id', OLD.user_id
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
    COALESCE(auth.uid(), OLD.user_id, OLD.id),
    user_display_name,
    CASE 
      WHEN TG_TABLE_NAME = 'timesheet_entries' THEN 'entry_deleted'
      WHEN TG_TABLE_NAME = 'projects' THEN 'project_deleted'
      WHEN TG_TABLE_NAME = 'contracts' THEN 'contract_deleted'
      WHEN TG_TABLE_NAME = 'profiles' THEN 'member_deleted'
      WHEN TG_TABLE_NAME = 'project_assignments' THEN 'user_unassigned'
      WHEN TG_TABLE_NAME = 'contract_assignments' THEN 'user_unassigned'
    END,
    entity_name_val,
    description_val,
    details_val
  );

  RETURN OLD;
END;
$$;

-- Create assignment audit function
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

-- Create report logging function
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
  ELSE
    entity_name_val := 'Audit Report';
    description_val := 'Generated audit report (' || p_result_count || ' log entries)';
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

-- Update the direct fetch function
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

-- Update action types function
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

-- Now create all the triggers (checking if they don't exist first)
DO $$
BEGIN
    -- INSERT triggers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'timesheet_entries_insert_audit') THEN
        CREATE TRIGGER timesheet_entries_insert_audit
          AFTER INSERT ON public.timesheet_entries
          FOR EACH ROW EXECUTE FUNCTION public.log_insert_audit();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'projects_insert_audit') THEN
        CREATE TRIGGER projects_insert_audit
          AFTER INSERT ON public.projects
          FOR EACH ROW EXECUTE FUNCTION public.log_insert_audit();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'contracts_insert_audit') THEN
        CREATE TRIGGER contracts_insert_audit
          AFTER INSERT ON public.contracts
          FOR EACH ROW EXECUTE FUNCTION public.log_insert_audit();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_insert_audit') THEN
        CREATE TRIGGER profiles_insert_audit
          AFTER INSERT ON public.profiles
          FOR EACH ROW EXECUTE FUNCTION public.log_insert_audit();
    END IF;

    -- UPDATE triggers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'timesheet_entries_update_audit') THEN
        CREATE TRIGGER timesheet_entries_update_audit
          AFTER UPDATE ON public.timesheet_entries
          FOR EACH ROW EXECUTE FUNCTION public.log_update_audit();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'projects_update_audit') THEN
        CREATE TRIGGER projects_update_audit
          AFTER UPDATE ON public.projects
          FOR EACH ROW EXECUTE FUNCTION public.log_update_audit();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'contracts_update_audit') THEN
        CREATE TRIGGER contracts_update_audit
          AFTER UPDATE ON public.contracts
          FOR EACH ROW EXECUTE FUNCTION public.log_update_audit();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_update_audit') THEN
        CREATE TRIGGER profiles_update_audit
          AFTER UPDATE ON public.profiles
          FOR EACH ROW EXECUTE FUNCTION public.log_update_audit();
    END IF;

    -- DELETE triggers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'timesheet_entries_deletion_audit') THEN
        CREATE TRIGGER timesheet_entries_deletion_audit
          BEFORE DELETE ON public.timesheet_entries
          FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'projects_deletion_audit') THEN
        CREATE TRIGGER projects_deletion_audit
          BEFORE DELETE ON public.projects
          FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'contracts_deletion_audit') THEN
        CREATE TRIGGER contracts_deletion_audit
          BEFORE DELETE ON public.contracts
          FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_delete_audit') THEN
        CREATE TRIGGER profiles_delete_audit
          AFTER DELETE ON public.profiles
          FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'project_assignments_deletion_audit') THEN
        CREATE TRIGGER project_assignments_deletion_audit
          BEFORE DELETE ON public.project_assignments
          FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'contract_assignments_deletion_audit') THEN
        CREATE TRIGGER contract_assignments_deletion_audit
          BEFORE DELETE ON public.contract_assignments
          FOR EACH ROW EXECUTE FUNCTION public.log_deletion_audit();
    END IF;

    -- ASSIGNMENT triggers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'project_assignments_insert_audit') THEN
        CREATE TRIGGER project_assignments_insert_audit
          AFTER INSERT ON public.project_assignments
          FOR EACH ROW EXECUTE FUNCTION public.log_assignment_audit();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'contract_assignments_insert_audit') THEN
        CREATE TRIGGER contract_assignments_insert_audit
          AFTER INSERT ON public.contract_assignments
          FOR EACH ROW EXECUTE FUNCTION public.log_assignment_audit();
    END IF;
END
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_insert_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_update_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_deletion_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_assignment_audit TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_report_generation_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_audit_logs_direct TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_audit_action_types TO authenticated;
