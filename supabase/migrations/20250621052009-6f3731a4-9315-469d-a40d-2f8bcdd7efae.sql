
-- Fix the audit logging function to handle deletion cases where user context might be missing
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
  ELSIF TG_TABLE_NAME = 'project_assignments' THEN
    audit_user_id := COALESCE(OLD.assigned_by, auth.uid());  -- Use assigned_by or current user
  ELSIF TG_TABLE_NAME = 'contract_assignments' THEN
    audit_user_id := COALESCE(OLD.assigned_by, auth.uid());  -- Use assigned_by or current user
  ELSE
    audit_user_id := auth.uid();  -- For other tables, use current auth user
  END IF;

  -- If we still don't have a user_id, skip audit logging to prevent constraint violation
  IF audit_user_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- Get user display name using the correct audit_user_id
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = audit_user_id;

  -- If we can't find the user name, use a default
  IF user_display_name IS NULL THEN
    user_display_name := 'System User';
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
    
    description_val := 'Unassigned ' || COALESCE(description_val, 'Unknown User') || ' from project: ' || COALESCE(entity_name_val, 'Unknown Project');
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
    
    description_val := 'Unassigned ' || COALESCE(description_val, 'Unknown User') || ' from contract: ' || COALESCE(entity_name_val, 'Unknown Contract');
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

-- Now retry the cleanup for Maria Sudianto
-- Delete all project assignments for Maria Sudianto (user ID: 48883bc2-4962-4b76-a350-e1f021377367)
DELETE FROM public.project_assignments 
WHERE user_id = '48883bc2-4962-4b76-a350-e1f021377367';

-- Delete any contract assignments for Maria (if any exist)
DELETE FROM public.contract_assignments 
WHERE user_id = '48883bc2-4962-4b76-a350-e1f021377367';

-- Delete any timesheet entries for Maria (if any exist)
DELETE FROM public.timesheet_entries 
WHERE user_id = '48883bc2-4962-4b76-a350-e1f021377367';

-- Delete any work schedules for Maria (if any exist)
DELETE FROM public.work_schedules 
WHERE user_id = '48883bc2-4962-4b76-a350-e1f021377367';

-- Delete any weekly work schedules for Maria (if any exist)
DELETE FROM public.weekly_work_schedules 
WHERE user_id = '48883bc2-4962-4b76-a350-e1f021377367';

-- Verify no remaining references exist
SELECT 'project_assignments' as table_name, COUNT(*) as count 
FROM public.project_assignments 
WHERE user_id = '48883bc2-4962-4b76-a350-e1f021377367'
UNION ALL
SELECT 'contract_assignments' as table_name, COUNT(*) as count 
FROM public.contract_assignments 
WHERE user_id = '48883bc2-4962-4b76-a350-e1f021377367'
UNION ALL
SELECT 'timesheet_entries' as table_name, COUNT(*) as count 
FROM public.timesheet_entries 
WHERE user_id = '48883bc2-4962-4b76-a350-e1f021377367'
UNION ALL
SELECT 'work_schedules' as table_name, COUNT(*) as count 
FROM public.work_schedules 
WHERE user_id = '48883bc2-4962-4b76-a350-e1f021377367'
UNION ALL
SELECT 'weekly_work_schedules' as table_name, COUNT(*) as count 
FROM public.weekly_work_schedules 
WHERE user_id = '48883bc2-4962-4b76-a350-e1f021377367';
