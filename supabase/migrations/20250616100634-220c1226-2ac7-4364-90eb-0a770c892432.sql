
-- Remove the policies we created
DROP POLICY IF EXISTS "timesheet_select_policy" ON public.timesheet_entries;
DROP POLICY IF EXISTS "timesheet_insert_policy" ON public.timesheet_entries;
DROP POLICY IF EXISTS "timesheet_update_policy" ON public.timesheet_entries;
DROP POLICY IF EXISTS "timesheet_delete_policy" ON public.timesheet_entries;

-- Restore the original RLS policies that were in place before
CREATE POLICY "Enable read access for own entries" ON public.timesheet_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for own entries" ON public.timesheet_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own entries" ON public.timesheet_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for own entries" ON public.timesheet_entries
  FOR DELETE USING (auth.uid() = user_id);
