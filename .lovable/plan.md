

## Enhance Post-Cutoff Leave Warning with Pay Period Context

### Problem
The current warning is generic: "will be processed in the next pay period." The user wants it to show the actual pay period dates so admins know exactly which entries are deferred. For example: "Pay run covers 2nd-13th, paid on the 10th. Leave from 11th-13th (after Tuesday cutoff) will appear in the next pay run."

### Solution
Update `ReportDataTable` to:
1. Fetch the current pay period from `pay_periods` table (using the report's date range) to get `period_start`, `period_end`, `payroll_cutoff_date`, and `payroll_date`
2. Use the `payroll_cutoff_date` from the pay period instead of the generic "Tuesday" day-of-week check — entries with leave after the cutoff date get flagged
3. Update the alert banner to show specific dates: e.g., "This pay run covers Mar 2–13, paid Mar 10. 3 leave entries after the cutoff (Mar 10) will be deducted in the next pay run (Mar 14–27)."
4. Also fetch the next pay period to show its date range in the warning

### Files changed

**`src/components/reports/ReportDataTable.tsx`**
- Add state and `useEffect` to fetch pay periods from Supabase matching the report date range
- Replace the generic `isAfterTuesdayCutoff` day-of-week check with comparison against the actual `payroll_cutoff_date` from the pay period
- Update the amber alert text to include specific pay period dates (period start/end, pay date, next period dates)
- Keep the ⚠️ badge on individual rows

**`src/components/reports/ReportDataTable.tsx`** — the alert will read something like:
> **3 leave entries after cutoff (Tue Mar 10)**
> This pay run covers Mon Mar 2 – Fri Mar 13, paid on Tue Mar 10. These entries (marked with ⚠️) fall after the cutoff and will be deducted in the next pay run (Mar 14 – Mar 27).

### Technical detail
- Query `pay_periods` where `period_start <= filters.startDate` and `period_end >= filters.endDate` to find the matching pay period
- Also query the next pay period (`period_start > currentPeriod.period_end`, limit 1, order ascending)
- Fall back to the existing `isAfterTuesdayCutoff` logic if no pay period is found

