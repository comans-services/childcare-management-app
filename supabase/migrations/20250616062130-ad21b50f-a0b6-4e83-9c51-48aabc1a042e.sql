
-- Check what triggers are currently on the projects table
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_table = 'projects'
ORDER BY t.trigger_name;

-- Check what triggers are currently on the contracts table  
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_table = 'contracts'
ORDER BY t.trigger_name;

-- Remove the incorrect timesheet user trigger from projects table if it exists
DROP TRIGGER IF EXISTS set_timesheet_user_trigger ON public.projects;

-- Remove the incorrect timesheet user trigger from contracts table if it exists
DROP TRIGGER IF EXISTS set_timesheet_user_trigger ON public.contracts;

-- Ensure the timesheet user trigger is only on timesheet_entries table
-- (This should already exist based on the migration, but let's make sure)
DROP TRIGGER IF EXISTS set_timesheet_user_trigger ON public.timesheet_entries;

CREATE TRIGGER set_timesheet_user_trigger
  BEFORE INSERT ON public.timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_timesheet_user_with_name();
