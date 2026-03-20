-- 1. Create leave_adjustments table
CREATE TABLE IF NOT EXISTS public.leave_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_pay_period_id uuid NOT NULL REFERENCES public.pay_periods(id) ON DELETE CASCADE,
  target_pay_period_id uuid NOT NULL REFERENCES public.pay_periods(id) ON DELETE CASCADE,
  leave_date date NOT NULL,
  hours_to_deduct numeric NOT NULL DEFAULT 0,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, leave_date, original_pay_period_id)
);

-- Enable RLS
ALTER TABLE public.leave_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage leave adjustments"
  ON public.leave_adjustments
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view own leave adjustments"
  ON public.leave_adjustments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Update get_payroll_report to calculate leave split by cutoff
CREATE OR REPLACE FUNCTION public.get_payroll_report(p_pay_period_id uuid)
 RETURNS TABLE(user_id uuid, full_name text, employee_id character varying, scheduled_hours numeric, actual_hours numeric, leave_hours_pre_cutoff numeric, leave_hours_post_cutoff numeric, prior_period_adjustments numeric, net_hours numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  v_period record;
BEGIN
  SELECT * INTO v_period
  FROM public.pay_periods
  WHERE id = p_pay_period_id;
  
  IF v_period IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  WITH user_scheduled AS (
    SELECT 
      ws.user_id,
      (COALESCE(ws.monday_hours,0) + COALESCE(ws.tuesday_hours,0) + COALESCE(ws.wednesday_hours,0) + 
       COALESCE(ws.thursday_hours,0) + COALESCE(ws.friday_hours,0) + COALESCE(ws.saturday_hours,0) + COALESCE(ws.sunday_hours,0)) as weekly_hours,
      CEIL((v_period.period_end - v_period.period_start + 1)::numeric / 7.0) as num_weeks
    FROM public.work_schedules ws
  ),
  user_actual AS (
    SELECT 
      te.user_id,
      SUM(te.hours_logged) as total_actual
    FROM public.timesheet_entries te
    WHERE te.entry_date >= v_period.period_start
      AND te.entry_date <= v_period.period_end
    GROUP BY te.user_id
  ),
  leave_pre AS (
    SELECT
      te.user_id,
      SUM(te.hours_logged) as total_leave_pre
    FROM public.timesheet_entries te
    WHERE te.entry_date >= v_period.period_start
      AND te.entry_date <= v_period.period_end
      AND te.leave_type IS NOT NULL
      AND te.entry_date <= v_period.payroll_cutoff_date
    GROUP BY te.user_id
  ),
  leave_post AS (
    SELECT
      te.user_id,
      SUM(te.hours_logged) as total_leave_post
    FROM public.timesheet_entries te
    WHERE te.entry_date >= v_period.period_start
      AND te.entry_date <= v_period.period_end
      AND te.leave_type IS NOT NULL
      AND te.entry_date > v_period.payroll_cutoff_date
    GROUP BY te.user_id
  ),
  prior_adj AS (
    SELECT
      la.user_id,
      SUM(la.hours_to_deduct) as total_prior_adj
    FROM public.leave_adjustments la
    WHERE la.target_pay_period_id = p_pay_period_id
      AND la.status = 'pending'
    GROUP BY la.user_id
  )
  SELECT 
    p.id as user_id,
    p.full_name,
    p.employee_id,
    COALESCE(us.weekly_hours * us.num_weeks, 0)::numeric as scheduled_hours,
    COALESCE(ua.total_actual, 0)::numeric as actual_hours,
    COALESCE(lp.total_leave_pre, 0)::numeric as leave_hours_pre_cutoff,
    COALESCE(lpo.total_leave_post, 0)::numeric as leave_hours_post_cutoff,
    COALESCE(pa.total_prior_adj, 0)::numeric as prior_period_adjustments,
    (COALESCE(ua.total_actual, 0) - COALESCE(lp.total_leave_pre, 0) - COALESCE(pa.total_prior_adj, 0))::numeric as net_hours
  FROM public.profiles p
  LEFT JOIN user_scheduled us ON us.user_id = p.id
  LEFT JOIN user_actual ua ON ua.user_id = p.id
  LEFT JOIN leave_pre lp ON lp.user_id = p.id
  LEFT JOIN leave_post lpo ON lpo.user_id = p.id
  LEFT JOIN prior_adj pa ON pa.user_id = p.id
  WHERE p.is_active = true
  ORDER BY p.full_name;
END;
$function$;
