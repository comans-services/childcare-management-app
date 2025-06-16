
-- Create enhanced trigger function that handles both regular users and admin editing
CREATE OR REPLACE FUNCTION public.set_timesheet_user_with_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- If user_id is not provided, or if non-admin user, set to current user
  IF NEW.user_id IS NULL OR current_user_role != 'admin' THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Set user_full_name from profiles table for the target user
  SELECT full_name INTO NEW.user_full_name
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync user_full_name when profiles are updated
CREATE OR REPLACE FUNCTION public.sync_timesheet_user_names()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update all timesheet entries for this user when their full_name changes
  UPDATE public.timesheet_entries 
  SET user_full_name = NEW.full_name
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_timesheet_user_trigger ON public.timesheet_entries;
DROP TRIGGER IF EXISTS sync_user_names_trigger ON public.profiles;

-- Create the timesheet user trigger
CREATE TRIGGER set_timesheet_user_trigger
  BEFORE INSERT ON public.timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_timesheet_user_with_name();

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

-- Enable RLS on timesheet_entries if not already enabled
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Admins can view all entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Users can insert their own entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Admins can insert entries for any user" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Admins can update any entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Admins can delete any entries" ON public.timesheet_entries;

-- Create RLS policies that support admin editing
CREATE POLICY "Users can view their own entries" ON public.timesheet_entries
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can insert their own entries" ON public.timesheet_entries
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can update their own entries" ON public.timesheet_entries
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can delete their own entries" ON public.timesheet_entries
  FOR DELETE USING (
    auth.uid() = user_id OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
