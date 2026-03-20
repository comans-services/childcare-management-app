

## Auto-Create Leave Adjustments for Post-Cutoff Leave

### Problem
When an employee takes leave after the pay date (post-cutoff), the system shows it as an amber warning in the current period but nothing automatically carries it forward as a deduction in the next pay period. The `leave_adjustments` table exists and `get_payroll_report` already reads from it, but no records are ever created.

### Solution
Create a database trigger on `timesheet_entries` that automatically manages `leave_adjustments` records:

- **On INSERT/UPDATE**: If the entry has a `leave_type` and `entry_date > payroll_cutoff_date` for its pay period, insert a `leave_adjustments` record targeting the next pay period with `hours_to_deduct = hours_logged`.
- **On UPDATE** (leave_type cleared or date changed): Remove the old adjustment if it no longer applies.
- **On DELETE**: Remove the corresponding adjustment.

### Database Migration

**New trigger function: `auto_create_leave_adjustment()`**
```sql
CREATE OR REPLACE FUNCTION public.auto_create_leave_adjustment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_id uuid;
  v_cutoff_date date;
  v_next_period_id uuid;
BEGIN
  -- On DELETE or UPDATE, remove old adjustment for the old entry
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    DELETE FROM public.leave_adjustments
    WHERE user_id = OLD.user_id
      AND leave_date = OLD.entry_date
      AND reason = 'Auto: post-cutoff leave from timesheet entry ' || OLD.id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  -- On INSERT or UPDATE, check if new entry qualifies
  IF NEW.leave_type IS NOT NULL THEN
    v_period_id := public.get_pay_period_for_date(NEW.entry_date);
    
    IF v_period_id IS NOT NULL THEN
      SELECT payroll_cutoff_date INTO v_cutoff_date
      FROM public.pay_periods WHERE id = v_period_id;
      
      IF NEW.entry_date > v_cutoff_date THEN
        v_next_period_id := public.get_next_pay_period(v_period_id);
        
        IF v_next_period_id IS NOT NULL THEN
          INSERT INTO public.leave_adjustments (
            user_id, original_pay_period_id, target_pay_period_id,
            leave_date, hours_to_deduct, reason, status
          ) VALUES (
            NEW.user_id, v_period_id, v_next_period_id,
            NEW.entry_date, NEW.hours_logged,
            'Auto: post-cutoff leave from timesheet entry ' || NEW.id,
            'pending'
          );
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
```

**Attach trigger to `timesheet_entries`:**
```sql
CREATE TRIGGER trg_auto_leave_adjustment
AFTER INSERT OR UPDATE OR DELETE ON public.timesheet_entries
FOR EACH ROW EXECUTE FUNCTION public.auto_create_leave_adjustment();
```

### No Code Changes Needed
- `get_payroll_report` already reads `leave_adjustments` where `target_pay_period_id` matches and shows them as "Prior Adj."
- The payroll CSV export already includes the "Prior Adjustments" column
- The UI table already shows prior adjustments in red

### Result
When an employee logs leave (e.g., Annual Leave on Wed Mar 25, which is after the Mar 24 cutoff):
1. Current period (Mar 16–29) shows it as amber "Leave (Post)" warning
2. A `leave_adjustments` record is auto-created targeting the next period (Mar 30–Apr 12)
3. Next period's report shows it under "Prior Adj." in red, so the employer knows to deduct

