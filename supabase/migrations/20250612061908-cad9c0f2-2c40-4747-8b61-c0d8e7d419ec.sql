
-- Drop the incorrect foreign key constraint that points to auth.users
ALTER TABLE public.work_schedules 
DROP CONSTRAINT IF EXISTS work_schedules_locked_by_fkey;

-- Add the correct foreign key constraint pointing to profiles table
ALTER TABLE public.work_schedules 
ADD CONSTRAINT work_schedules_locked_by_fkey 
FOREIGN KEY (locked_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
