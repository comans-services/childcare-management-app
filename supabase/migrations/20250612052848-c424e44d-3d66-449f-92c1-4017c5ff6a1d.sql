
-- First, let's check if user_id foreign key exists and add it if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_schedules_user_id_fkey' 
        AND table_name = 'work_schedules'
    ) THEN
        ALTER TABLE public.work_schedules 
        ADD CONSTRAINT work_schedules_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check if the locked_by foreign key constraint exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_schedules_locked_by_fkey' 
        AND table_name = 'work_schedules'
    ) THEN
        ALTER TABLE public.work_schedules 
        ADD CONSTRAINT work_schedules_locked_by_fkey 
        FOREIGN KEY (locked_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;
