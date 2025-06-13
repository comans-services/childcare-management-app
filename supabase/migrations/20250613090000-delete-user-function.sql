
-- Create a secure function to delete users and all their associated data
CREATE OR REPLACE FUNCTION public.delete_user_cascade(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_name_val text;
BEGIN
  -- Get user name for audit logging
  SELECT COALESCE(full_name, email, 'Unknown User') INTO user_name_val
  FROM public.profiles WHERE id = p_user_id;

  -- Only allow admins to delete users
  IF NOT (SELECT public.get_current_user_role() = 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Delete in correct order to avoid foreign key constraints
  
  -- Delete timesheet entries
  DELETE FROM public.timesheet_entries WHERE user_id = p_user_id;
  
  -- Delete project assignments
  DELETE FROM public.project_assignments WHERE user_id = p_user_id;
  
  -- Delete contract assignments  
  DELETE FROM public.contract_assignments WHERE user_id = p_user_id;
  
  -- Delete work schedules
  DELETE FROM public.work_schedules WHERE user_id = p_user_id;
  
  -- Delete weekly work schedules
  DELETE FROM public.weekly_work_schedules WHERE user_id = p_user_id;
  
  -- Delete profile (this will trigger audit logging)
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- Log the user deletion manually since we can't rely on profile trigger for the full cascade
  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    action,
    entity_name,
    description,
    details
  ) VALUES (
    auth.uid(),
    (SELECT COALESCE(full_name, email, 'System') FROM public.profiles WHERE id = auth.uid()),
    'member_deleted',
    user_name_val,
    'Completely removed user: ' || user_name_val || ' and all associated data',
    jsonb_build_object(
      'deleted_user_id', p_user_id,
      'deleted_user_name', user_name_val,
      'cascade_deletion', true
    )
  );
  
END;
$$;

-- Grant execute permission to authenticated users (admin check is done inside function)
GRANT EXECUTE ON FUNCTION public.delete_user_cascade TO authenticated;
