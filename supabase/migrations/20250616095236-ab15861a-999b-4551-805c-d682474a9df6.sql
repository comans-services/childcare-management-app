
-- Clean up all conflicting RLS policies on timesheet_entries table
DROP POLICY IF EXISTS "Users can view their own entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Admins can view all entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Users can insert their own entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Admins can insert entries for any user" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Admins can update any entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Admins can delete any entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "timesheet_entries_select_policy" ON public.timesheet_entries;
DROP POLICY IF EXISTS "timesheet_entries_insert_policy" ON public.timesheet_entries;
DROP POLICY IF EXISTS "timesheet_entries_update_policy" ON public.timesheet_entries;
DROP POLICY IF EXISTS "timesheet_entries_delete_policy" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Enable read access for own entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Enable insert for own entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Enable update for own entries" ON public.timesheet_entries;

-- Create 4 clean, simple policies that give admins full access
CREATE POLICY "timesheet_select_policy" ON public.timesheet_entries
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "timesheet_insert_policy" ON public.timesheet_entries
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "timesheet_update_policy" ON public.timesheet_entries
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "timesheet_delete_policy" ON public.timesheet_entries
  FOR DELETE USING (
    user_id = auth.uid() OR 
    public.get_current_user_role() = 'admin'
  );
