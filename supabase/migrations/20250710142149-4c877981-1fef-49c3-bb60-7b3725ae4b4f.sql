-- Fix admin timesheet entry creation by cleaning up conflicting triggers

-- First, drop any old triggers that might be conflicting
DROP TRIGGER IF EXISTS set_timesheet_user_trigger ON public.timesheet_entries;
DROP TRIGGER IF EXISTS set_contract_timesheet_user_trigger ON public.timesheet_entries;

-- Drop old trigger functions that might be causing conflicts
DROP FUNCTION IF EXISTS public.set_timesheet_user();
DROP FUNCTION IF EXISTS public.set_contract_timesheet_user();

-- Recreate the correct trigger with the proper function
CREATE TRIGGER set_timesheet_user_trigger
  BEFORE INSERT ON public.timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_timesheet_user_with_name();

-- Verify the function logic is correct (this should already exist but let's make sure)
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
  
  -- Get current user's role
  SELECT role::text INTO current_user_role
  FROM public.profiles 
  WHERE id = current_user_id;
  
  -- Debug logging
  RAISE LOG 'Trigger: current_user_id=%, current_user_role=%, NEW.user_id=%', 
    current_user_id, current_user_role, NEW.user_id;
  
  -- If user_id is not provided, always set to current user
  IF NEW.user_id IS NULL THEN
    NEW.user_id := current_user_id;
    RAISE LOG 'Trigger: Set user_id to current user (NULL case)';
  -- If user_id is provided but different from current user, only allow if admin
  ELSIF NEW.user_id != current_user_id THEN
    -- Only admins can create entries for other users
    IF current_user_role != 'admin' THEN
      -- Non-admin users can only create entries for themselves
      NEW.user_id := current_user_id;
      RAISE LOG 'Trigger: Non-admin attempted to set different user_id, overriding to current user';
    ELSE
      -- Admin can preserve the provided user_id
      RAISE LOG 'Trigger: Admin creating entry for user_id=%', NEW.user_id;
    END IF;
  ELSE
    RAISE LOG 'Trigger: user_id matches current user, no change needed';
  END IF;
  
  -- Set user_full_name from profiles table for the target user
  SELECT full_name INTO NEW.user_full_name
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  RAISE LOG 'Trigger: Final user_id=%, user_full_name=%', NEW.user_id, NEW.user_full_name;
  
  RETURN NEW;
END;
$$;