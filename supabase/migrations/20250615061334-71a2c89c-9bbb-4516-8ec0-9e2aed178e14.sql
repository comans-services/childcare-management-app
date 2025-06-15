
-- Fix the audit functions to handle tables without user_id field properly
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
  audit_user_id uuid;
BEGIN
  -- Get user display name
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = auth.uid();

  -- Determine the user_id to use for audit log based on table
  IF TG_TABLE_NAME = 'profiles' THEN
    audit_user_id := NEW.id;  -- For profiles, use the profile id
  ELSIF TG_TABLE_NAME = 'timesheet_entries' THEN
    audit_user_id := NEW.user_id;  -- timesheet_entries has user_id
  ELSE
    audit_user_id := auth.uid();  -- For other tables, use current auth user
  END IF;

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

  -- Insert audit log only if we have valid data
  IF entity_name_val IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      user_id,
      user_name,
      action,
      entity_name,
      description,
      details
    ) VALUES (
      audit_user_id,
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
  END IF;

  RETURN NEW;
END;
$$;

-- Fix the update audit function
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
  audit_user_id uuid;
BEGIN
  -- Get user display name
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = auth.uid();

  -- Determine the user_id to use for audit log based on table
  IF TG_TABLE_NAME = 'profiles' THEN
    audit_user_id := NEW.id;  -- For profiles, use the profile id
  ELSIF TG_TABLE_NAME = 'timesheet_entries' THEN
    audit_user_id := NEW.user_id;  -- timesheet_entries has user_id
  ELSE
    audit_user_id := auth.uid();  -- For other tables, use current auth user
  END IF;

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

  -- Insert audit log only if we have valid data
  IF entity_name_val IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      user_id,
      user_name,
      action,
      entity_name,
      description,
      details
    ) VALUES (
      audit_user_id,
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
  END IF;

  RETURN NEW;
END;
$$;

-- Fix the deletion audit function  
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
  audit_user_id uuid;
BEGIN
  -- Get user display name
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = auth.uid();

  -- Determine the user_id to use for audit log based on table
  IF TG_TABLE_NAME = 'profiles' THEN
    audit_user_id := OLD.id;  -- For profiles, use the profile id
  ELSIF TG_TABLE_NAME = 'timesheet_entries' THEN
    audit_user_id := OLD.user_id;  -- timesheet_entries has user_id
  ELSE
    audit_user_id := auth.uid();  -- For other tables, use current auth user
  END IF;

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

  -- Insert audit log only if we have valid data
  IF entity_name_val IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      user_id,
      user_name,
      action,
      entity_name,
      description,
      details
    ) VALUES (
      audit_user_id,
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
  END IF;

  RETURN OLD;
END;
$$;

-- Now create the missing triggers for audit logging
-- First, clean up any potential duplicate triggers
DROP TRIGGER IF EXISTS timesheet_entries_insert_audit ON public.timesheet_entries;
DROP TRIGGER IF EXISTS timesheet_entries_update_audit ON public.timesheet_entries;
DROP TRIGGER IF EXISTS projects_insert_audit ON public.projects;
DROP TRIGGER IF EXISTS projects_update_audit ON public.projects;
DROP TRIGGER IF EXISTS contracts_insert_audit ON public.contracts;
DROP TRIGGER IF EXISTS contracts_update_audit ON public.contracts;
DROP TRIGGER IF EXISTS profiles_insert_audit ON public.profiles;
DROP TRIGGER IF EXISTS profiles_update_audit ON public.profiles;

-- Create the insert triggers
CREATE TRIGGER timesheet_entries_insert_audit
  AFTER INSERT ON public.timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_insert_audit();

CREATE TRIGGER projects_insert_audit
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_insert_audit();

CREATE TRIGGER contracts_insert_audit
  AFTER INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.log_insert_audit();

CREATE TRIGGER profiles_insert_audit
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_insert_audit();

-- Create the update triggers
CREATE TRIGGER timesheet_entries_update_audit
  AFTER UPDATE ON public.timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_update_audit();

CREATE TRIGGER projects_update_audit
  AFTER UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_update_audit();

CREATE TRIGGER contracts_update_audit
  AFTER UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.log_update_audit();

CREATE TRIGGER profiles_update_audit
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_update_audit();
