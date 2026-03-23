

## Make Audit Logs Show Plain English Descriptions

### Problem
The audit logs table shows raw technical action strings like `public_holiday_created`, `user_login_success`, and the details column just shows "Click to expand" with raw JSON underneath. Not human-readable.

### Solution
Update `AuditLogsTable.tsx` to:

1. **Add a `formatActionDescription` function** that converts the raw `action` + `details` into a plain English sentence. Examples:
   - `public_holiday_created` + details → "Added public holiday: New Year's Day (01/01/2026)"
   - `user_login_success` + details → "Logged in successfully (chinh@...)"
   - `user_login_failed` + details → "Failed login attempt for chinh@..."
   - `user_logout` → "Logged out"
   - `password_changed` → "Changed their password"
   - `timesheet_locked` + details → "Locked timesheet for [user] until [date]"
   - `timesheet_unlocked` + details → "Unlocked timesheet for [user]"
   - `timesheet_report_generated` → "Generated timesheet report ([count] entries)"
   - `audit_report_generated` → "Generated audit report ([count] entries)"
   - DB trigger events with `details.operation = INSERT/UPDATE/DELETE` and `details.table` → "Created/Updated/Deleted [table item] - [relevant field values]"

2. **Show the plain English description** directly in the "Details" column instead of "Click to expand"

3. **Keep the expandable raw JSON** for technical users who want full details, but the main view is human-readable

4. **Improve the Action badge** to show cleaner category labels like "Holiday", "Login", "Report", "Timesheet" instead of just "Created"/"Updated"

### File Changes
- `src/components/reports/AuditLogsTable.tsx` — add `formatActionDescription()` helper, update `getActionBadge()` for better categories, show description in Details column

### No database or other file changes needed

