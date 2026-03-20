

## Add Pay Period Quick-Select to Report Filters

### What
Add a "Pay Period" dropdown next to the existing date range pickers in the Report Filters. When a pay period is selected, it auto-fills the start/end dates. This gives admins a quick way to generate reports aligned to pay periods.

### Changes

**`src/components/reports/filters/DateRangeFilter.tsx`**:
- Import `useState`, `useEffect`, `Select` components, `fetchPayPeriods`, `format` from date-fns
- Fetch pay periods on mount (reuse `fetchPayPeriods` from payroll-service)
- Add a "Pay Period" `<Select>` dropdown beside the existing date pickers
- When a period is selected, set `filters.startDate` and `filters.endDate` to that period's `period_start` and `period_end`
- When the user manually changes dates, clear the period selection (set to "custom")
- Layout: Pay Period dropdown on the left, then "to" date pickers on the right, all in one row

### UI Layout
```text
[Pay Period: Mar 2 - Mar 15 ▼]  |  [📅 Start date]  to  [📅 End date]
```

### Technical Details
- Reuse `fetchPayPeriods` from `@/lib/payroll/payroll-service` (already used in PayrollReportsSection)
- Default the pay period dropdown to the current period (same logic as PayrollReportsSection)
- Manual date edits reset the dropdown to show "Custom Range"
- No new files needed — just updating `DateRangeFilter.tsx`

