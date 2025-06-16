
-- Phase 1: Add user_full_name column to timesheet_entries table
ALTER TABLE public.timesheet_entries 
ADD COLUMN user_full_name TEXT;

-- Create function to automatically set user_full_name from profiles
CREATE OR REPLACE FUNCTION public.set_timesheet_user_with_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Set user_id to current authenticated user
  NEW.user_id := auth.uid();
  
  -- Set user_full_name from profiles table
  SELECT full_name INTO NEW.user_full_name
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN NEW;
END;
$function$;

-- Create trigger to sync user_full_name when profiles are updated
CREATE OR REPLACE FUNCTION public.sync_timesheet_user_names()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Update all timesheet entries for this user when their full_name changes
  UPDATE public.timesheet_entries 
  SET user_full_name = NEW.full_name
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$function$;

-- Create the profile sync trigger
CREATE TRIGGER sync_user_names_trigger
  AFTER UPDATE OF full_name ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_timesheet_user_names();

-- Backfill existing entries with user names from profiles
UPDATE public.timesheet_entries 
SET user_full_name = p.full_name
FROM public.profiles p
WHERE timesheet_entries.user_id = p.id 
AND timesheet_entries.user_full_name IS NULL;
