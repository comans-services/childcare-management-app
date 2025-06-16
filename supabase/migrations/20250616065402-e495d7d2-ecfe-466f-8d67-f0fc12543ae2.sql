
-- Fix the log_update_audit function to resolve the user_id field access issue
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
  -- Get user display name
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = auth.uid();

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
