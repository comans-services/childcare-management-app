

## Fix Payroll Report to Calculate Leave Hours by Cutoff

### Current State (broken)
The `get_payroll_report` database function hardcodes three fields to zero:
- `leave_hours_pre_cutoff` = 0
- `leave_hours_post_cutoff` = 0
- `prior_period_adjustments` = 0
- `net_hours` = just `actual_hours` (no adjustments)

The `leave_adjustments` table referenced in `create_leave_adjustments_for_application` **does not exist** yet. The timesheet report shows visual warnings but no actual calculation feeds into the payroll report.

### What will be done

**1. Create `leave_adjustments` table** (database migration)
- Stores records of leave taken after the cutoff that must be deducted in the next pay period
- Columns: `user_id`, `original_pay_period_id`, `target_pay_period_id`, `leave_date`, `hours_to_deduct`, `reason`, `status`

**2. Update `get_payroll_report` function** (database migration)
- Query `timesheet_entries` where `leave_type IS NOT NULL` within the pay period date range
- Split leave hours into **pre-cutoff** (entry_date <= payroll_cutoff_date) and **post-cutoff** (entry_date > payroll_cutoff_date)
- Query `leave_adjustments` where `target_pay_period_id` = current period to get **prior period adjustments** (deferred leave from the previous pay run)
- Calculate `net_hours = actual_hours - leave_hours_pre_cutoff - prior_period_adjustments`

**3. Auto-create leave adjustments** (database migration)
- Update `create_leave_adjustments_for_application` to work with the new table
- Or add a simpler approach: when the payroll report runs, it identifies post-cutoff leave in the current period and the admin knows those hours will appear as "prior adjustments" in the next period's report

### Final State After Fix

When an admin views the **Payroll Report** for a pay period (e.g., Oct 6-19, cutoff Oct 6, paid Oct 6):

| Employee | Scheduled | Actual | Leave (Pre) | Leave (Post) | Prior Adj. | Net Hours |
|----------|-----------|--------|-------------|--------------|------------|-----------|
| Jane     | 76.00     | 68.00  | 8.00        | 8.00         | -0.00      | 60.00     |
| John     | 76.00     | 76.00  | 0.00        | 0.00         | -8.00      | 68.00     |

- **Leave (Pre-Cutoff)**: Leave taken on/before Oct 6 -- deducted this pay run
- **Leave (Post-Cutoff)** (amber): Leave taken Oct 7-19 -- shown as warning, will be deducted **next** pay run
- **Prior Adj.** (red): Deferred leave from the **previous** pay period that is now being deducted
- **Net Hours** = Actual - Leave(Pre) - Prior Adjustments

The Timesheet Report continues to show the visual ⚠️ warnings with specific dates. The Payroll Report now has the actual calculated numbers instead of zeros.

### Files changed
- Database migration: create `leave_adjustments` table, update `get_payroll_report` function
- `src/components/reports/PayrollReportsSection.tsx`: minor — add amber/red styling for post-cutoff and adjustment columns (already has the columns, just needs color)

