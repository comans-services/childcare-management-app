
-- Phase 2: Update the timesheet trigger to use the new function that sets user_full_name
DROP TRIGGER IF EXISTS set_timesheet_user_trigger ON public.timesheet_entries;

CREATE TRIGGER set_timesheet_user_trigger
  BEFORE INSERT ON public.timesheet_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_timesheet_user_with_name();
