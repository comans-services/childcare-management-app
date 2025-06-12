
-- Add timesheet locking columns to existing work_schedules table
ALTER TABLE public.work_schedules 
ADD COLUMN locked_until_date DATE,
ADD COLUMN lock_reason TEXT,
ADD COLUMN locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN locked_by UUID REFERENCES auth.users(id);

-- Create function to check if a date is locked for a specific user
CREATE OR REPLACE FUNCTION public.is_date_locked_for_user(p_user_id UUID, entry_date DATE)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.work_schedules 
    WHERE user_id = p_user_id 
      AND locked_until_date IS NOT NULL 
      AND entry_date <= locked_until_date
  );
$$;

-- Create function to get global lock status (for admin interface)
CREATE OR REPLACE FUNCTION public.get_global_lock_status()
RETURNS TABLE(
  total_users_locked BIGINT,
  earliest_lock_date DATE,
  latest_lock_date DATE,
  most_common_reason TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    COUNT(*) as total_users_locked,
    MIN(locked_until_date) as earliest_lock_date,
    MAX(locked_until_date) as latest_lock_date,
    MODE() WITHIN GROUP (ORDER BY lock_reason) as most_common_reason
  FROM public.work_schedules 
  WHERE locked_until_date IS NOT NULL;
$$;
