
-- Fix the set_timesheet_user_with_name function to properly handle admin users
-- The issue is that auth.uid() context may not be properly available in triggers
-- So we'll use a more robust approach with proper admin detection

CREATE OR REPLACE FUNCTION public.set_timesheet_user_with_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  current_user_id uuid;
  is_admin_override boolean := false;
BEGIN
  -- Get current authenticated user ID
  current_user_id := auth.uid();
  
  -- Enhanced logging for debugging
  RAISE LOG 'TRIGGER START: current_user_id=%, NEW.user_id=%', 
    current_user_id, NEW.user_id;
  
  -- If no authenticated user, this shouldn't happen but handle gracefully
  IF current_user_id IS NULL THEN
    RAISE LOG 'WARNING: No authenticated user found in trigger';
    -- If user_id is provided, keep it; otherwise this will fail
    IF NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot create timesheet entry without valid user context';
    END IF;
  END IF;
  
  -- Get current user's role with enhanced error handling
  BEGIN
    SELECT role::text INTO current_user_role
    FROM public.profiles 
    WHERE id = current_user_id;
    
    RAISE LOG 'Role query result: current_user_role=%', current_user_role;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error getting user role: %', SQLERRM;
    current_user_role := 'employee'; -- Default fallback
  END;
  
  -- If user_id is not provided, always set to current user
  IF NEW.user_id IS NULL THEN
    NEW.user_id := current_user_id;
    RAISE LOG 'Set user_id to current user (was null)';
  -- If user_id is provided but different from current user
  ELSIF NEW.user_id != current_user_id THEN
    RAISE LOG 'Admin override check: current_user_role=%, NEW.user_id=%, current_user_id=%', 
      current_user_role, NEW.user_id, current_user_id;
    
    -- Only admins can create entries for other users
    IF current_user_role = 'admin' THEN
      RAISE LOG 'Admin override ALLOWED: keeping target user_id=%', NEW.user_id;
      is_admin_override := true;
      -- Keep NEW.user_id as is (don't change it)
    ELSE
      RAISE LOG 'Admin override DENIED: changing user_id from % to %', NEW.user_id, current_user_id;
      -- Non-admin users can only create entries for themselves
      NEW.user_id := current_user_id;
    END IF;
  ELSE
    RAISE LOG 'User creating entry for themselves';
  END IF;
  
  -- Set user_full_name from profiles table for the target user (not current user)
  SELECT full_name INTO NEW.user_full_name
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  RAISE LOG 'TRIGGER END: final user_id=%, user_full_name=%, is_admin_override=%', 
    NEW.user_id, NEW.user_full_name, is_admin_override;
  
  RETURN NEW;
END;
$$;
