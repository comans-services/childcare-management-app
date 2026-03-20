

## Fix: Prior Period Leave Adjustments Not Appearing in Export

### Problem
The export's "Prior Period Leave Adjustments" section relies solely on the `leave_adjustments` table, which is empty. Leave is entered directly as timesheet entries with a `leave_type` field, bypassing the `leave_applications` → `create_leave_adjustments_for_application` workflow. So the export never finds any adjustments.

**Real data**: Chinh Phan has 3 days of Leave Without Pay (Mar 11, 12, 13) — all after the previous period's cutoff date of Mar 10. These should appear as deductions in the Mar 16-29 export, but don't.

### Solution
Change `fetchMatrixData` to detect post-cutoff leave directly from `timesheet_entries` in the **previous** pay period, instead of relying on the `leave_adjustments` table.

### Changes to `src/lib/reports/timesheet-matrix-export-service.ts`

Replace the "Fetch prior period leave adjustments" block (~lines 166-210) with logic that:

1. Find the pay period matching the filter dates (existing)
2. Find the **previous** pay period (the one ending just before the current period starts)
3. Query `timesheet_entries` where:
   - `entry_date > previous_period.payroll_cutoff_date`
   - `entry_date <= previous_period.period_end`
   - `leave_type IS NOT NULL`
4. Build the `leaveAdjustments` array from those entries, using the previous period's dates as `original_period_start/end`

This means the export will always show post-cutoff leave from the prior period regardless of whether `leave_adjustments` records exist.

### No other files change
The CSV and PDF rendering code already handles the `leaveAdjustments` array correctly.

