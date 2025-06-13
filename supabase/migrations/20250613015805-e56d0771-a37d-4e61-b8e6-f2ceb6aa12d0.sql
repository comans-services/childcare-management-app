
-- Check existing policies and clean up systematically

-- First, let's enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop the profiles policy if it exists and recreate it
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- For timesheet_entries, drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view their own timesheet entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Users can insert their own timesheet entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Users can update their own timesheet entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Users can delete their own timesheet entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "emp_view_own_timesheet_entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "emp_insert_own_timesheet_entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "emp_update_own_timesheet_entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "emp_delete_own_timesheet_entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Users can manage their own timesheet entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Employees can view their own timesheet entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Employees can insert their own timesheet entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Employees can update their own timesheet entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Employees can delete their own timesheet entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Admins can view all timesheet entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Admins can insert timesheet entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Admins can update all timesheet entries" ON public.timesheet_entries;
DROP POLICY IF EXISTS "Admins can delete all timesheet entries" ON public.timesheet_entries;

-- Now create the clean timesheet_entries policies
CREATE POLICY "Users can view their own timesheet entries" ON public.timesheet_entries
FOR SELECT USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() = 'admin'
);

CREATE POLICY "Users can insert their own timesheet entries" ON public.timesheet_entries
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timesheet entries" ON public.timesheet_entries
FOR UPDATE USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() = 'admin'
);

CREATE POLICY "Users can delete their own timesheet entries" ON public.timesheet_entries
FOR DELETE USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() = 'admin'
);

-- Clean up projects policies
DROP POLICY IF EXISTS "Users can view assigned projects or admins can view all" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Employees can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage projects" ON public.projects;

-- Create clean projects policies
CREATE POLICY "Users can view assigned projects or admins can view all" ON public.projects
FOR SELECT USING (
  public.get_current_user_role() = 'admin' OR
  public.is_user_assigned_to_project(auth.uid(), id)
);

CREATE POLICY "Admins can manage projects" ON public.projects
FOR ALL USING (public.get_current_user_role() = 'admin');

-- Clean up project_assignments policies
DROP POLICY IF EXISTS "Users can view their assignments or admins can view all" ON public.project_assignments;
DROP POLICY IF EXISTS "Admins can manage project assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Users can view their own project assignments" ON public.project_assignments;
DROP POLICY IF EXISTS "Admins can manage all project assignments" ON public.project_assignments;

-- Create clean project_assignments policies
CREATE POLICY "Users can view their assignments or admins can view all" ON public.project_assignments
FOR SELECT USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() = 'admin'
);

CREATE POLICY "Admins can manage project assignments" ON public.project_assignments
FOR ALL USING (public.get_current_user_role() = 'admin');
