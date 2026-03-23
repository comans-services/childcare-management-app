

## Insert 2026-2027 Public Holidays and Fix Permission Logic

### 1. Insert Holiday Data
Insert all 28 public holidays (13 for 2026, 15 for 2027) into the `public_holidays` table using the Supabase insert tool.

### 2. Fix Server-Side Holiday Validation

**Problem found**: The server-side `validateHolidayEntry` in `holiday-validation-service.ts` blocks ALL holidays for ALL users unconditionally. It never checks the per-user `allow_holiday_entries` permission from `work_schedules`. This means:
- Even users with `allow_holiday_entries: true` get blocked
- Admins get blocked too (server-side)

The client-side `useHolidayLock` hook correctly checks permissions, but the mutation service's server-side check overrides it.

**Fix in `src/lib/timesheet/entry-mutation-service.ts`**:
- Pass `entry.user_id` to the holiday validation
- Update `validateHolidayEntry` in `holiday-validation-service.ts` to accept a `userId` parameter
- Check the user's `allow_holiday_entries` permission from `work_schedules`
- Check if user has admin role via `user_roles` table
- Only block if the user has no permission AND is not admin

**Fix in `src/lib/timesheet/validation/holiday-validation-service.ts`**:
- Add `userId` parameter to `validateHolidayEntry`
- After confirming it's a holiday, query `work_schedules.allow_holiday_entries` for that user
- Query `user_roles` to check if user is admin
- Return `isValid: true` if admin or has permission, `isValid: false` otherwise

### Current State (all 5 users)
All users have `allow_holiday_entries: false` — so holidays will be blocked for everyone as requested. Admins can still override. If specific users need access later, the admin can toggle it per-user in the Holiday Management page.

### No Database Schema Changes
Only data inserts (holidays) and code fixes (validation logic).

