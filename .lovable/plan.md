

## Fix Pay Period Structure: Pay Day on Second Tuesday

### Problem
The current `generate_pay_periods` function sets the cutoff/pay date to the **first** Tuesday of the fortnight. The user confirms employees get paid on the **second** Tuesday.

Example for a period Mon Mar 2 – Sun Mar 15:
- Current (wrong): pay date = Mar 3 (first Tuesday)
- Correct: pay date = Mar 10 (second Tuesday)

This means the cutoff should also be the second Tuesday. Leave taken after pay day (Mar 11–15) gets flagged and deferred to the next period.

### Also: Duplicate periods still exist
Two generation runs created overlapping periods (Dec 1 batch and Dec 2 batch). These need cleaning up.

### SQL Commands to Run Manually

**Step 1: Delete all existing pay periods**
```sql
DELETE FROM pay_periods;
```

**Step 2: Replace `generate_pay_periods` function**
Change the cutoff/pay date calculation from first Tuesday to **second Tuesday** (first Tuesday + 7 days):

```sql
CREATE OR REPLACE FUNCTION public.generate_pay_periods(
  p_start_date date, 
  p_num_periods integer DEFAULT 12
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_start date;
  v_current_end date;
  v_cutoff_date date;
  v_payroll_date date;
  v_periods_created integer := 0;
BEGIN
  -- Ensure start date is a Monday
  v_current_start := p_start_date - ((EXTRACT(DOW FROM p_start_date)::int + 6) % 7);
  
  FOR i IN 1..p_num_periods LOOP
    v_current_end := v_current_start + 13; -- 14 days: Mon to Sun (2 weeks)
    
    -- Second Tuesday = first Monday + 8 days
    v_cutoff_date := v_current_start + 8;
    v_payroll_date := v_cutoff_date;
    
    INSERT INTO public.pay_periods (
      period_start, period_end, payroll_cutoff_date, payroll_date, status
    ) VALUES (
      v_current_start, v_current_end, v_cutoff_date, v_payroll_date, 'open'
    )
    ON CONFLICT (period_start, period_end) DO NOTHING;
    
    IF FOUND THEN
      v_periods_created := v_periods_created + 1;
    END IF;
    
    v_current_start := v_current_end + 1;
  END LOOP;
  
  RETURN v_periods_created;
END;
$$;
```

**Step 3: Generate fresh periods**
```sql
SELECT generate_pay_periods('2025-12-01'::date, 24);
```

### Result
| Field | Example |
|-------|---------|
| period_start | Mon, Mar 2, 2026 |
| period_end | Sun, Mar 15, 2026 |
| payroll_cutoff_date | Tue, Mar 10, 2026 (second Tuesday) |
| payroll_date | Tue, Mar 10, 2026 |

Leave taken Mar 11–15 (after pay day) → amber warning, deferred to next period as "Prior Adj."

### No code changes needed
The UI and `get_payroll_report` function already use `payroll_cutoff_date` correctly. Once the periods have the right dates, everything works.

