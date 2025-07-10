
-- Fix the set_timesheet_user_with_name function to properly handle admin users
CREATE OR REPLACE FUNCTION public.set_timesheet_user_with_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  current_user_id uuid;
BEGIN
  -- Get current authenticated user ID
  current_user_id := auth.uid();
  
  -- Get current user's role using a more reliable method
  SELECT role::text INTO current_user_role
  FROM public.profiles 
  WHERE id = current_user_id;
  
  -- Debug logging (can be removed later)
  RAISE LOG 'Trigger: current_user_id=%, current_user_role=%, NEW.user_id=%', 
    current_user_id, current_user_role, NEW.user_id;
  
  -- If user_id is not provided, always set to current user
  IF NEW.user_id IS NULL THEN
    NEW.user_id := current_user_id;
  -- If user_id is provided but different from current user, only allow if admin
  ELSIF NEW.user_id != current_user_id THEN
    -- Only admins can create entries for other users
    IF current_user_role != 'admin' THEN
      -- Non-admin users can only create entries for themselves
      NEW.user_id := current_user_id;
    END IF;
    -- If admin, preserve the provided user_id (no change needed)
  END IF;
  
  -- Set user_full_name from profiles table for the target user (not current user)
  SELECT full_name INTO NEW.user_full_name
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;
