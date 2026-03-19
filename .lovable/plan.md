

## Plan: Remove `role` column from `profiles` table and use `user_roles` table exclusively

### What changes

**1. Database migration** — Drop the `role` column from `profiles` and clean up related objects:
- Drop the `sync_user_role_to_profile` trigger (no longer needed)
- Drop the `sync_user_role_to_profile()` function
- Update the "Employees can update own profile" RLS policy to remove the role-protection check (no longer needed since column won't exist)
- Drop the `role` column from `profiles`
- Drop the `user_role` enum type if no longer used elsewhere

**2. Update `fetchUsers` in `src/lib/user-service.ts`**:
- Remove `role` from the profiles SELECT query
- After fetching profiles, join with `user_roles` table to get each user's role
- Keep `role` on the `User` interface (populated from `user_roles` instead)

**3. Update `fetchUserById` in `src/lib/user-service.ts`**:
- Remove `role` from SELECT query
- Query `user_roles` for the user's role separately

**4. Update `updateUser` in `src/lib/user-service.ts`**:
- Remove `role` from the profiles UPDATE
- When role changes, upsert into `user_roles` table instead

**5. Update `createUser` in `src/lib/user-service.ts`**:
- Remove `role` from profile INSERT (column won't exist)
- Keep the existing `user_roles` INSERT

**6. Update `src/lib/csv-import/processors.ts`**:
- Remove `role` from the profile INSERT data
- Keep the existing `user_roles` INSERT

**7. Update `src/context/auth/authOperations.ts`**:
- No changes needed (already queries `user_roles` only)

**8. UI components** — These already display `user.role` from the `User` interface, which will now be populated from `user_roles`. No changes needed in:
- `TeamList.tsx`, `AddEditUserDialog.tsx`, `UnifiedUserScheduleCard.tsx`, `UserWorkScheduleCard.tsx`, `UserWeeklyWorkScheduleCard.tsx`

### Files modified
- `src/lib/user-service.ts` — Remove `role` from profile queries/mutations, fetch from `user_roles`
- `src/lib/csv-import/processors.ts` — Remove `role` from profile INSERT
- Database migration — Drop column, trigger, function, update RLS

