
-- Remove the current restrictive policies
DROP POLICY IF EXISTS "Enable read access for own entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Enable insert for own entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Enable update for own entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Enable delete for own entries" ON public.timesheet_entries;

-- Create new policies that allow admin full access while maintaining user restrictions
CREATE POLICY "timesheet_select_policy" ON public.timesheet_entries
  FOR SELECT USING (
    auth.uid() = user_id OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "timesheet_insert_policy" ON public.timesheet_entries
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "timesheet_update_policy" ON public.timesheet_entries
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "timesheet_delete_policy" ON public.timesheet_entries
  FOR DELETE USING (
    auth.uid() = user_id OR 
    public.get_current_user_role() = 'admin'
  );
