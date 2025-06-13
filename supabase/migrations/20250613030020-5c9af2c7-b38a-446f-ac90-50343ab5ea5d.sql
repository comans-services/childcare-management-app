
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
    COALESCE(auth.uid(), NEW.user_id),
    user_display_name,
    CASE 
      WHEN TG_TABLE_NAME = 'timesheet_entries' THEN 'entry_created'
      WHEN TG_TABLE_NAME = 'projects' THEN 'project_created'
      WHEN TG_TABLE_NAME = 'contracts' THEN 'contract_created'
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
    COALESCE(auth.uid(), NEW.user_id),
    user_display_name,
    CASE 
      WHEN TG_TABLE_NAME = 'timesheet_entries' THEN 'entry_updated'
      WHEN TG_TABLE_NAME = 'projects' THEN 'project_updated'
      WHEN TG_TABLE_NAME = 'contracts' THEN 'contract_updated'
    END,
    entity_name_val,
    description_val,
    details_val
  );

  RETURN NEW;
END;
$$;

-- Create INSERT triggers for all tables
CREATE TRIGGER timesheet_entries_insert_audit
  AFTER INSERT ON public.timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_insert_audit();

CREATE TRIGGER projects_insert_audit
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_insert_audit();

CREATE TRIGGER contracts_insert_audit
  AFTER INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.log_insert_audit();

-- Create UPDATE triggers for all tables
CREATE TRIGGER timesheet_entries_update_audit
  AFTER UPDATE ON public.timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_update_audit();

CREATE TRIGGER projects_update_audit
  AFTER UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_update_audit();

CREATE TRIGGER contracts_update_audit
  AFTER UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.log_update_audit();

-- Update the action types function to include all possible actions
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
    'user_unassigned'
  ];
$$;
