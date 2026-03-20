

## Fix Pay Period Default Selection to Use Pay Date

### Problem
The dropdown defaults to `periods[0]` (the most recent/future period). The user wants it to default to the period whose **payroll_date** matches today or is closest. For example, if today is near March 10 (a pay date), it should select the period March 2–14 because that period's `payroll_date` is March 10.

### Solution
Update `loadPayPeriods` in `PayrollReportsSection.tsx` to find the period where today falls between `period_start` and `period_end`, OR where the `payroll_date` is closest to today. The logic:

1. First, try to find a period where `payroll_date` matches today
2. If not, find a period where today falls within `period_start` to `period_end`
3. If neither, find the period with the closest `payroll_date` to today (past preferred)
4. Fallback to `periods[0]`

### Change

**`src/components/reports/PayrollReportsSection.tsx`** — update `loadPayPeriods`:

```typescript
const loadPayPeriods = async () => {
  try {
    const periods = await fetchPayPeriods(24);
    setPayPeriods(periods);
    if (periods.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Period where today is within the date range
      const currentPeriod = periods.find(
        p => p.period_start <= today && p.period_end >= today
      );
      
      // 2. Period with the closest past or current payroll_date
      const closestByPayDate = periods
        .filter(p => p.payroll_date <= today)
        .sort((a, b) => b.payroll_date.localeCompare(a.payroll_date))[0];
      
      setSelectedPeriod(
        currentPeriod?.id || closestByPayDate?.id || periods[0].id
      );
    }
  } catch (error) {
    toast.error("Failed to load pay periods");
    console.error(error);
  }
};
```

This ensures the dropdown defaults to the period containing today's date, and if today is between periods, it picks the most recent one by pay date.

