

## Include Prior Period Leave Adjustments in Timesheet Export

### What
When exporting the timesheet report (CSV/PDF), include a "Prior Period Adjustments" summary section showing any leave taken after the previous period's cutoff that needs to be deducted from the current period. This gives employers the information they need to process salary deductions for post-cutoff leave.

### How It Works
The report date range is matched to a pay period. Any `leave_adjustments` records where `target_pay_period_id` matches that period are fetched and appended as a summary section after the daily hours matrix.

### Changes

**`src/lib/reports/timesheet-matrix-export-service.ts`**:

1. Add a new interface `LeaveAdjustmentData` with fields: `user_id`, `full_name`, `leave_date`, `hours_to_deduct`, `reason`, `original_period_start`, `original_period_end`
2. Extend `MatrixData` with an optional `leaveAdjustments: LeaveAdjustmentData[]` field
3. In `fetchMatrixData`:
   - Query `pay_periods` to find the period matching the filter's start/end dates
   - If a matching period is found, query `leave_adjustments` joined with `profiles` and `pay_periods` (for original period info) where `target_pay_period_id` = matched period and `status = 'pending'`
   - Attach results to the returned `MatrixData`
4. In `generateMatrixCSV`:
   - After the legend, add a "Prior Period Leave Adjustments" section if any exist
   - Format: `Employee Name, Leave Date, Hours to Deduct, Original Period, Reason`
   - Add a total deduction row
5. In `generateMatrixPDF`:
   - After the legend, add a second small table for adjustments if any exist
   - Same columns as CSV

### Export Layout (CSV example)
```text
[... existing matrix ...]

"Legend: PH = Public Holiday, ..."

"Prior Period Leave Adjustments"
"Employee","Leave Date","Hours","Original Period","Reason"
"Jane Smith","Wed 26/03/2025","7.6","Mar 16 – Mar 29","Auto: post-cutoff leave"
"Total Hours to Deduct","","7.6","",""
```

### No database changes needed
All data already exists in `leave_adjustments` and `pay_periods` tables.

