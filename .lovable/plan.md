

## Fix: WorkSchedulePage fetching non-existent `role` column from `profiles`

### Problem
`WorkSchedulePage.tsx` line 49 queries `profiles` with `select("id, email, full_name, role")`, but the `role` column no longer exists on `profiles`.

### Solution
Update `WorkSchedulePage.tsx` to:
1. Remove `role` from the profiles SELECT query
2. Fetch roles from the `user_roles` table separately and merge them

### File changed
- `src/pages/WorkSchedulePage.tsx` — Update `fetchUsers` function to remove `role` from profiles query and join with `user_roles` table

### Technical detail
```typescript
// Change the fetchUsers function:
// 1. Select without role: .select("id, email, full_name")
// 2. After fetching profiles, query user_roles for all user IDs
// 3. Merge role data into user objects
```

