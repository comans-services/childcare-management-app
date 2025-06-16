
-- Step 1: Clean up conflicting RLS policies on projects table
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete all projects" ON public.projects;

-- Step 2: Fix the get_current_user_role function to handle edge cases
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.profiles WHERE id = auth.uid()),
    'employee'
  );
$$;

-- Step 3: Create simple, working RLS policies for projects
CREATE POLICY "Enable read access for authenticated users" ON public.projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.projects
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for admins" ON public.projects
  FOR DELETE USING (public.get_current_user_role() = 'admin');

-- Step 4: Clean up conflicting RLS policies on contracts table
DROP POLICY IF EXISTS "Users can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins can view all contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins can update all contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins can delete all contracts" ON public.contracts;

-- Create simple, working RLS policies for contracts
CREATE POLICY "Enable read access for authenticated users" ON public.contracts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.contracts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.contracts
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for admins" ON public.contracts
  FOR DELETE USING (public.get_current_user_role() = 'admin');

-- Step 5: Create the missing 'contracts' storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false);

-- Step 6: Create storage policies for the contracts bucket
CREATE POLICY "Enable authenticated users to upload contract files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'contracts' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Enable authenticated users to view contract files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'contracts' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Enable authenticated users to update contract files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'contracts' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Enable authenticated users to delete contract files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'contracts' AND 
    auth.role() = 'authenticated'
  );
