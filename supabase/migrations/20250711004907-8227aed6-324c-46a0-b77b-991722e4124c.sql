-- Phase 1: Database Triggers & Functions for Leave and Holiday Audit Logging

-- Update audit action types function to include leave and holiday actions
CREATE OR REPLACE FUNCTION public.get_audit_action_types()
RETURNS text[]
LANGUAGE sql
STABLE
AS $function$
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
    'audit_report_generated',
    -- Leave application actions
    'leave_application_created',
    'leave_application_updated',
    'leave_application_cancelled',
    'leave_application_approved',
    'leave_application_rejected',
    -- Leave balance actions
    'leave_balance_created',
    'leave_balance_updated',
    'leave_balance_deleted',
    -- Holiday permission actions
    'holiday_permission_granted',
    'holiday_permission_revoked',
    'holiday_permission_updated',
    -- Custom holiday actions
    'custom_holiday_created',
    'custom_holiday_updated',
    'custom_holiday_deleted',
    -- Document actions
    'document_uploaded',
    'document_deleted'
  ];
$function$;

-- Create audit logging function for leave applications
CREATE OR REPLACE FUNCTION public.log_leave_application_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_display_name text;
  leave_type_name text;
  description_val text;
  details_val jsonb;
  action_type text;
  audit_user_id uuid;
BEGIN
  -- Determine action type and audit user
  IF TG_OP = 'INSERT' THEN
    action_type := 'leave_application_created';
    audit_user_id := NEW.user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check for status changes to determine specific action
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      action_type := 'leave_application_approved';
      audit_user_id := NEW.approved_by;
    ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
      action_type := 'leave_application_rejected';
      audit_user_id := NEW.approved_by;
    ELSIF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
      action_type := 'leave_application_cancelled';
      audit_user_id := NEW.user_id;
    ELSE
      action_type := 'leave_application_updated';
      audit_user_id := NEW.user_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'leave_application_deleted';
    audit_user_id := OLD.user_id;
  END IF;

  -- Get user display name
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
  FROM public.profiles WHERE id = audit_user_id;

  -- Get leave type name
  IF TG_OP = 'DELETE' THEN
    SELECT name INTO leave_type_name FROM public.leave_types WHERE id = OLD.leave_type_id;
  ELSE
    SELECT name INTO leave_type_name FROM public.leave_types WHERE id = NEW.leave_type_id;
  END IF;

  -- Build description and details based on operation
  IF TG_OP = 'INSERT' THEN
    description_val := 'Created leave application for ' || COALESCE(leave_type_name, 'Unknown Leave Type') ||
                     ' from ' || NEW.start_date || ' to ' || NEW.end_date ||
                     ' (' || NEW.business_days_count || ' business days)';
    details_val := jsonb_build_object(
      'leave_type_id', NEW.leave_type_id,
      'leave_type_name', leave_type_name,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date,
      'business_days_count', NEW.business_days_count,
      'reason', NEW.reason,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF action_type = 'leave_application_approved' THEN
      -- Get approver name
      SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
      FROM public.profiles WHERE id = NEW.approved_by;
      
      description_val := 'Approved leave application for ' || COALESCE(leave_type_name, 'Unknown Leave Type') ||
                        ' from ' || NEW.start_date || ' to ' || NEW.end_date;
    ELSIF action_type = 'leave_application_rejected' THEN
      -- Get approver name
      SELECT COALESCE(full_name, email, 'Unknown User') INTO user_display_name
      FROM public.profiles WHERE id = NEW.approved_by;
      
      description_val := 'Rejected leave application for ' || COALESCE(leave_type_name, 'Unknown Leave Type') ||
                        ' from ' || NEW.start_date || ' to ' || NEW.end_date;
    ELSIF action_type = 'leave_application_cancelled' THEN
      description_val := 'Cancelled leave application for ' || COALESCE(leave_type_name, 'Unknown Leave Type') ||
                        ' from ' || NEW.start_date || ' to ' || NEW.end_date;
    ELSE
      description_val := 'Updated leave application for ' || COALESCE(leave_type_name, 'Unknown Leave Type');
    END IF;
    
    details_val := jsonb_build_object(
      'leave_type_id', NEW.leave_type_id,
      'leave_type_name', leave_type_name,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date,
      'business_days_count', NEW.business_days_count,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'manager_comments', NEW.manager_comments,
      'approved_by', NEW.approved_by,
      'approved_at', NEW.approved_at
    );
  ELSIF TG_OP = 'DELETE' THEN
    description_val := 'Deleted leave application for ' || COALESCE(leave_type_name, 'Unknown Leave Type') ||
                      ' from ' || OLD.start_date || ' to ' || OLD.end_date;
    details_val := jsonb_build_object(
      'leave_type_id', OLD.leave_type_id,
      'leave_type_name', leave_type_name,
      'start_date', OLD.start_date,
      'end_date', OLD.end_date,
      'business_days_count', OLD.business_days_count,
      'status', OLD.status
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
    audit_user_id,
    user_display_name,
    action_type,
    'Leave Application',
    description_val,
    details_val
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Create audit logging function for leave balances
CREATE OR REPLACE FUNCTION public.log_leave_balance_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_display_name text;
  leave_type_name text;
  target_user_name text;
  description_val text;
  details_val jsonb;
  action_type text;
  audit_user_id uuid;
BEGIN
  -- Determine action type and audit user
  IF TG_OP = 'INSERT' THEN
    action_type := 'leave_balance_created';
    audit_user_id := auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'leave_balance_updated';
    audit_user_id := auth.uid();
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'leave_balance_deleted';
    audit_user_id := auth.uid();
  END IF;

  -- Get audit user display name
  SELECT COALESCE(full_name, email, 'System') INTO user_display_name
  FROM public.profiles WHERE id = audit_user_id;

  -- Get target user name and leave type
  IF TG_OP = 'DELETE' THEN
    SELECT COALESCE(full_name, email, 'Unknown User') INTO target_user_name
    FROM public.profiles WHERE id = OLD.user_id;
    SELECT name INTO leave_type_name FROM public.leave_types WHERE id = OLD.leave_type_id;
  ELSE
    SELECT COALESCE(full_name, email, 'Unknown User') INTO target_user_name
    FROM public.profiles WHERE id = NEW.user_id;
    SELECT name INTO leave_type_name FROM public.leave_types WHERE id = NEW.leave_type_id;
  END IF;

  -- Build description and details
  IF TG_OP = 'INSERT' THEN
    description_val := 'Created leave balance for ' || target_user_name || 
                      ' - ' || COALESCE(leave_type_name, 'Unknown Leave Type') ||
                      ' (Year ' || NEW.year || ')';
    details_val := jsonb_build_object(
      'target_user_id', NEW.user_id,
      'target_user_name', target_user_name,
      'leave_type_id', NEW.leave_type_id,
      'leave_type_name', leave_type_name,
      'year', NEW.year,
      'total_days', NEW.total_days,
      'used_days', NEW.used_days,
      'remaining_days', NEW.remaining_days
    );
  ELSIF TG_OP = 'UPDATE' THEN
    description_val := 'Updated leave balance for ' || target_user_name || 
                      ' - ' || COALESCE(leave_type_name, 'Unknown Leave Type') ||
                      ' (Year ' || NEW.year || ')';
    details_val := jsonb_build_object(
      'target_user_id', NEW.user_id,
      'target_user_name', target_user_name,
      'leave_type_id', NEW.leave_type_id,
      'leave_type_name', leave_type_name,
      'year', NEW.year,
      'old_total_days', OLD.total_days,
      'new_total_days', NEW.total_days,
      'old_used_days', OLD.used_days,
      'new_used_days', NEW.used_days,
      'old_remaining_days', OLD.remaining_days,
      'new_remaining_days', NEW.remaining_days
    );
  ELSIF TG_OP = 'DELETE' THEN
    description_val := 'Deleted leave balance for ' || target_user_name || 
                      ' - ' || COALESCE(leave_type_name, 'Unknown Leave Type') ||
                      ' (Year ' || OLD.year || ')';
    details_val := jsonb_build_object(
      'target_user_id', OLD.user_id,
      'target_user_name', target_user_name,
      'leave_type_id', OLD.leave_type_id,
      'leave_type_name', leave_type_name,
      'year', OLD.year,
      'total_days', OLD.total_days,
      'used_days', OLD.used_days,
      'remaining_days', OLD.remaining_days
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
    audit_user_id,
    user_display_name,
    action_type,
    'Leave Balance',
    description_val,
    details_val
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Create audit logging function for holiday permissions
CREATE OR REPLACE FUNCTION public.log_holiday_permission_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_display_name text;
  target_user_name text;
  holiday_name text;
  description_val text;
  details_val jsonb;
  action_type text;
  audit_user_id uuid;
BEGIN
  -- Determine action type and audit user
  IF TG_OP = 'INSERT' THEN
    action_type := CASE WHEN NEW.is_allowed THEN 'holiday_permission_granted' ELSE 'holiday_permission_revoked' END;
    audit_user_id := COALESCE(NEW.created_by, auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_allowed != NEW.is_allowed THEN
      action_type := CASE WHEN NEW.is_allowed THEN 'holiday_permission_granted' ELSE 'holiday_permission_revoked' END;
    ELSE
      action_type := 'holiday_permission_updated';
    END IF;
    audit_user_id := auth.uid();
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'holiday_permission_deleted';
    audit_user_id := auth.uid();
  END IF;

  -- Get audit user display name
  SELECT COALESCE(full_name, email, 'System') INTO user_display_name
  FROM public.profiles WHERE id = audit_user_id;

  -- Get target user name and holiday name
  IF TG_OP = 'DELETE' THEN
    SELECT COALESCE(full_name, email, 'Unknown User') INTO target_user_name
    FROM public.profiles WHERE id = OLD.user_id;
    SELECT name INTO holiday_name FROM public.public_holidays WHERE id = OLD.holiday_id;
  ELSE
    SELECT COALESCE(full_name, email, 'Unknown User') INTO target_user_name
    FROM public.profiles WHERE id = NEW.user_id;
    SELECT name INTO holiday_name FROM public.public_holidays WHERE id = NEW.holiday_id;
  END IF;

  -- Build description and details
  IF TG_OP = 'INSERT' THEN
    description_val := CASE WHEN NEW.is_allowed 
                       THEN 'Granted holiday permission for ' || target_user_name || ' on ' || COALESCE(holiday_name, 'Unknown Holiday')
                       ELSE 'Revoked holiday permission for ' || target_user_name || ' on ' || COALESCE(holiday_name, 'Unknown Holiday')
                       END;
    details_val := jsonb_build_object(
      'target_user_id', NEW.user_id,
      'target_user_name', target_user_name,
      'holiday_id', NEW.holiday_id,
      'holiday_name', holiday_name,
      'is_allowed', NEW.is_allowed,
      'notes', NEW.notes,
      'created_by', NEW.created_by
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF action_type = 'holiday_permission_granted' THEN
      description_val := 'Granted holiday permission for ' || target_user_name || ' on ' || COALESCE(holiday_name, 'Unknown Holiday');
    ELSIF action_type = 'holiday_permission_revoked' THEN
      description_val := 'Revoked holiday permission for ' || target_user_name || ' on ' || COALESCE(holiday_name, 'Unknown Holiday');
    ELSE
      description_val := 'Updated holiday permission for ' || target_user_name || ' on ' || COALESCE(holiday_name, 'Unknown Holiday');
    END IF;
    
    details_val := jsonb_build_object(
      'target_user_id', NEW.user_id,
      'target_user_name', target_user_name,
      'holiday_id', NEW.holiday_id,
      'holiday_name', holiday_name,
      'old_is_allowed', OLD.is_allowed,
      'new_is_allowed', NEW.is_allowed,
      'old_notes', OLD.notes,
      'new_notes', NEW.notes
    );
  ELSIF TG_OP = 'DELETE' THEN
    description_val := 'Deleted holiday permission for ' || target_user_name || ' on ' || COALESCE(holiday_name, 'Unknown Holiday');
    details_val := jsonb_build_object(
      'target_user_id', OLD.user_id,
      'target_user_name', target_user_name,
      'holiday_id', OLD.holiday_id,
      'holiday_name', holiday_name,
      'was_allowed', OLD.is_allowed,
      'notes', OLD.notes
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
    audit_user_id,
    user_display_name,
    action_type,
    'Holiday Permission',
    description_val,
    details_val
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Create audit logging function for custom holidays
CREATE OR REPLACE FUNCTION public.log_custom_holiday_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_display_name text;
  description_val text;
  details_val jsonb;
  action_type text;
  audit_user_id uuid;
BEGIN
  -- Determine action type and audit user
  IF TG_OP = 'INSERT' THEN
    action_type := 'custom_holiday_created';
    audit_user_id := auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'custom_holiday_updated';
    audit_user_id := auth.uid();
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'custom_holiday_deleted';
    audit_user_id := auth.uid();
  END IF;

  -- Get audit user display name
  SELECT COALESCE(full_name, email, 'System') INTO user_display_name
  FROM public.profiles WHERE id = audit_user_id;

  -- Build description and details
  IF TG_OP = 'INSERT' THEN
    description_val := 'Created custom holiday: ' || NEW.name || ' on ' || NEW.date || ' (' || NEW.state || ')';
    details_val := jsonb_build_object(
      'holiday_name', NEW.name,
      'holiday_date', NEW.date,
      'state', NEW.state,
      'year', NEW.year
    );
  ELSIF TG_OP = 'UPDATE' THEN
    description_val := 'Updated custom holiday: ' || NEW.name || ' on ' || NEW.date || ' (' || NEW.state || ')';
    details_val := jsonb_build_object(
      'holiday_name', NEW.name,
      'holiday_date', NEW.date,
      'state', NEW.state,
      'year', NEW.year,
      'old_holiday_name', OLD.name,
      'old_holiday_date', OLD.date,
      'old_state', OLD.state
    );
  ELSIF TG_OP = 'DELETE' THEN
    description_val := 'Deleted custom holiday: ' || OLD.name || ' on ' || OLD.date || ' (' || OLD.state || ')';
    details_val := jsonb_build_object(
      'holiday_name', OLD.name,
      'holiday_date', OLD.date,
      'state', OLD.state,
      'year', OLD.year
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
    audit_user_id,
    user_display_name,
    action_type,
    'Custom Holiday',
    description_val,
    details_val
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Create triggers for leave applications
CREATE TRIGGER leave_applications_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leave_applications
  FOR EACH ROW EXECUTE FUNCTION public.log_leave_application_audit();

-- Create triggers for leave balances
CREATE TRIGGER leave_balances_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leave_balances
  FOR EACH ROW EXECUTE FUNCTION public.log_leave_balance_audit();

-- Create triggers for holiday permissions
CREATE TRIGGER holiday_permissions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_holiday_permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_holiday_permission_audit();

-- Create triggers for custom holidays
CREATE TRIGGER custom_holidays_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.public_holidays
  FOR EACH ROW EXECUTE FUNCTION public.log_custom_holiday_audit();