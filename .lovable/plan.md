

## Analysis: Dual Role System — `user_roles` table vs `profiles.role` column

### Current State

The app uses **both** systems inconsistently:

| Area | Uses `user_roles` table | Uses `profiles.role` column |
|------|------------------------|-----------------------------|
| AuthContext (login role fetch) | Yes | No |
| AdminRoute (route guard) | Yes | No |
| `isAdmin()` / `isManager()` utils | Yes | No |
| PayrollSettingsPage admin check | No | **Yes (BUG)** |
| Holiday lock / weekend validation | No | **Yes** |
| CSV user import | No | **Yes** |
| User service (CRUD) | No | **Yes** |
| UI badges (team list, schedule cards) | No | **Yes** |
| RLS on `pay_periods`, `work_schedules`, `payroll_settings`, `email_settings` | Yes (`has_role()`) | No |
| RLS on `timesheet_entries`, `audit_logs`, `campaigns`, `contacts`, `staff_room_entries`, `room_devices`, + 5 more tables | No | **Yes** (`profiles.role`) |

### The Problem

1. **PayrollSettingsPage** queries `profiles.role` directly — if a user has admin in `user_roles` but not in `profiles.role`, they get denied access.
2. **~15 RLS policies** check `profiles.role` instead of using `has_role()`. If the two columns are out of sync, users may be granted or denied access incorrectly.
3. **Weekend/holiday validation** checks `profiles.role` for admin override — could fail if `profiles.role` is stale.

### Recommended Fix

Migrate everything to use `user_roles` table consistently:

**Step 1 — Fix application code (5 files)**
- `PayrollSettingsPage.tsx`: Use `isAdmin()` from `utils/roles` instead of querying `profiles.role`
- `useHolidayLock.tsx`: Use `userRole` from AuthContext instead of `userProfile?.role`
- `weekend-validation-service.ts`: Query `user_roles` or accept role as parameter
- `user-service.ts`: Stop writing `role` to profiles on user create/update (or keep it as display-only, synced from `user_roles`)
- `csv-import/processors.ts`: When importing users, also insert into `user_roles` table

**Step 2 — Fix RLS policies (database migration)**
Update ~15 RLS policies on `timesheet_entries`, `audit_logs`, `campaigns`, `contacts`, `staff_room_entries`, `room_devices`, `childcare_rooms`, `room_activity_log`, `weekly_work_schedules`, `public_holidays`, `contact_imports`, `unsubscribes` to use `has_role(auth.uid(), 'admin')` instead of checking `profiles.role`.

**Step 3 — Optional cleanup**
- Consider keeping `profiles.role` as a display-only field (synced via trigger) or remove it entirely.
- Add a trigger on `user_roles` that syncs the value to `profiles.role` for display purposes.

### Impact
- Fixes potential access control bugs where `profiles.role` and `user_roles` are out of sync
- Centralizes role management to one authoritative source
- Prevents privilege escalation if `profiles.role` is manipulated (since employees can update their own profile)

### Security Note
The `profiles` table has a policy "Employees can update own profile" with `id = auth.uid()`. This means a user could theoretically update their own `profiles.role` to `'admin'` — a **privilege escalation vulnerability**. The `user_roles` table does not have this issue since only admins can manage it.

