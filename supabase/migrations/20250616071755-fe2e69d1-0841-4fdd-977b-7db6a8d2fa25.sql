
-- Fix the log_update_audit function to properly fetch user names using the correct user_id
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
  is_admin_edit boolean := false;
BEGIN
  -- Determine the user_id to use for audit log based on table
  IF TG_TABLE_NAME = 'profiles' THEN
    audit_user_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'timesheet_entries' THEN
    -- Check if this is an admin editing another user's entry
    IF NEW.user_id != auth.uid() THEN
      is_admin_edit := true;
    END IF;
    audit_user_id := NEW.user_id;
  ELSE
    audit_user_id := auth.uid();
  END IF;

  -- Get user display name using the correct audit_user_id (not always auth.uid())
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = audit_user_id;

  -- Handle different table updates
  IF TG_TABLE_NAME = 'timesheet_entries' THEN
    -- Get project or contract name for context
    IF NEW.project_id IS NOT NULL THEN
      SELECT p.name INTO entity_name_val FROM projects p WHERE p.id = NEW.project_id;
    ELSIF NEW.contract_id IS NOT NULL THEN
      SELECT c.name INTO entity_name_val FROM contracts c WHERE c.id = NEW.contract_id;
    ELSE
      entity_name_val := 'Unknown Project/Contract';
    END IF;
    
    -- Add admin prefix to description if admin is editing another user's entry
    description_val := CASE 
      WHEN is_admin_edit THEN '[ADMIN EDIT] Updated timesheet entry for ' 
      ELSE 'Updated timesheet entry for ' 
    END || COALESCE(entity_name_val, 'Unknown Project/Contract') || 
                      ' (' || NEW.hours_logged || ' hours on ' || NEW.entry_date || ')';
    
    details_val := jsonb_build_object(
      'project_id', NEW.project_id,
      'contract_id', NEW.contract_id,
      'hours_logged', NEW.hours_logged,
      'entry_date', NEW.entry_date,
      'entry_type', NEW.entry_type,
      'notes', NEW.notes,
      'old_hours_logged', OLD.hours_logged,
      'old_notes', OLD.notes,
      'is_admin_edit', is_admin_edit,
      'editor_id', auth.uid(),
      'target_user_id', NEW.user_id
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

-- Update the log_insert_audit function to use the correct user_id for fetching user names
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
  -- Determine the user_id to use for audit log based on table
  IF TG_TABLE_NAME = 'profiles' THEN
    audit_user_id := NEW.id;  -- For profiles, use the profile id
  ELSIF TG_TABLE_NAME = 'timesheet_entries' THEN
    audit_user_id := NEW.user_id;  -- timesheet_entries has user_id
  ELSE
    audit_user_id := auth.uid();  -- For other tables, use current auth user
  END IF;

  -- Get user display name using the correct audit_user_id
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = audit_user_id;

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

-- Update the log_deletion_audit function to use the correct user_id for fetching user names
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
  -- Determine the user_id to use for audit log based on table
  IF TG_TABLE_NAME = 'profiles' THEN
    audit_user_id := OLD.id;  -- For profiles, use the profile id
  ELSIF TG_TABLE_NAME = 'timesheet_entries' THEN
    audit_user_id := OLD.user_id;  -- timesheet_entries has user_id
  ELSE
    audit_user_id := auth.uid();  -- For other tables, use current auth user
  END IF;

  -- Get user display name using the correct audit_user_id
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = audit_user_id;

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

-- Update the log_assignment_audit function to use the correct user_id for fetching user names
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
  -- Get user display name using the assigned_by user or current auth user
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = COALESCE(NEW.assigned_by, auth.uid());

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

-- Backfill missing user names in existing audit logs
UPDATE public.audit_logs 
SET user_name = COALESCE(p.full_name, p.email, 'Unknown User')
FROM public.profiles p
WHERE audit_logs.user_id = p.id 
  AND audit_logs.user_name IS NULL;

-- Clean up orphaned audit log entries (those with user_ids that don't exist in profiles)
-- First, let's mark them with a meaningful user_name
UPDATE public.audit_logs 
SET user_name = 'Deleted User'
WHERE user_name IS NULL 
  AND user_id NOT IN (SELECT id FROM public.profiles);
