-- Add carry-over configuration to leave_types table
ALTER TABLE public.leave_types 
ADD COLUMN IF NOT EXISTS max_carry_over_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS carry_over_expiry_months integer DEFAULT 12;

-- Create leave balance operations table for tracking annual resets and adjustments
CREATE TABLE IF NOT EXISTS public.leave_balance_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type text NOT NULL CHECK (operation_type IN ('annual_reset', 'carry_over', 'manual_adjustment')),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES public.leave_types(id) ON DELETE CASCADE,
  year integer NOT NULL,
  amount numeric NOT NULL,
  reason text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  details jsonb
);

-- Enable RLS on leave_balance_operations
ALTER TABLE public.leave_balance_operations ENABLE ROW LEVEL SECURITY;

-- Create policies for leave_balance_operations
CREATE POLICY "Admins can manage leave balance operations" 
ON public.leave_balance_operations 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Users can view their own operations" 
ON public.leave_balance_operations 
FOR SELECT 
USING ((auth.uid() = user_id) OR (get_current_user_role() = 'admin'));

-- Create function for annual reset with carry-over
CREATE OR REPLACE FUNCTION public.perform_annual_reset(
  p_year integer DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_leave_type_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reset_year integer;
  balance_record record;
  carry_over_amount numeric;
  new_total_days numeric;
  results jsonb := '[]'::jsonb;
  result_item jsonb;
BEGIN
  -- Default to next year if not specified
  reset_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE) + 1);
  
  -- Loop through balances to reset
  FOR balance_record IN
    SELECT 
      lb.user_id,
      lb.leave_type_id,
      lb.total_days - lb.used_days as remaining_days,
      lt.default_balance_days,
      lt.max_carry_over_days,
      lt.carry_over_expiry_months,
      lt.name as leave_type_name
    FROM leave_balances lb
    JOIN leave_types lt ON lb.leave_type_id = lt.id
    JOIN profiles p ON lb.user_id = p.id
    WHERE lb.year = reset_year - 1
      AND p.employment_type = 'full-time'
      AND (p_user_id IS NULL OR lb.user_id = p_user_id)
      AND (p_leave_type_id IS NULL OR lb.leave_type_id = p_leave_type_id)
  LOOP
    -- Calculate carry over amount
    carry_over_amount := LEAST(
      balance_record.remaining_days,
      balance_record.max_carry_over_days
    );
    
    -- Calculate new total (default + carry over)
    new_total_days := balance_record.default_balance_days + carry_over_amount;
    
    -- Create or update balance for new year
    INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days)
    VALUES (
      balance_record.user_id,
      balance_record.leave_type_id,
      reset_year,
      new_total_days,
      0
    )
    ON CONFLICT (user_id, leave_type_id, year)
    DO UPDATE SET 
      total_days = EXCLUDED.total_days,
      updated_at = now();
    
    -- Log the operation
    INSERT INTO leave_balance_operations (
      operation_type,
      user_id,
      leave_type_id,
      year,
      amount,
      reason,
      created_by,
      details
    ) VALUES (
      'annual_reset',
      balance_record.user_id,
      balance_record.leave_type_id,
      reset_year,
      new_total_days,
      'Annual reset with carry-over',
      auth.uid(),
      jsonb_build_object(
        'old_remaining', balance_record.remaining_days,
        'carry_over', carry_over_amount,
        'new_total', new_total_days,
        'default_days', balance_record.default_balance_days
      )
    );
    
    -- Add result to array
    result_item := jsonb_build_object(
      'user_id', balance_record.user_id,
      'leave_type_id', balance_record.leave_type_id,
      'old_remaining', balance_record.remaining_days,
      'carry_over', carry_over_amount,
      'new_total', new_total_days
    );
    results := results || result_item;
  END LOOP;
  
  RETURN results;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_balance_operations_user_year ON public.leave_balance_operations(user_id, year);
CREATE INDEX IF NOT EXISTS idx_leave_balance_operations_type ON public.leave_balance_operations(operation_type);