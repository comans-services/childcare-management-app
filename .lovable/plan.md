

## Enforce Ratio Compliance on Staff Exit

### Current State
- **Staff in 2 rooms**: Already enforced. `staff_enter_room` checks if staff is in another room and blocks entry.
- **Ratio on exit**: NOT enforced. `staff_exit_room` allows any exit regardless of whether removing that staff member breaks the educator-to-child ratio. The frontend shows a yellow warning but still allows submission.

### Changes

**1. Database: Update `staff_exit_room` function**

Add a ratio check before allowing exit. If removing the staff member would leave fewer educators than required (`calculate_required_educators`), return `success: false` with a warning message and block the exit.

```sql
-- Before updating staff_room_entries, check:
-- current_staff_count - 1 >= calculate_required_educators(children_under_3, children_over_3)
-- If not, return error with message like:
-- "Cannot exit: removing [name] would leave [N-1] staff for [X] children (minimum [required] required)"
```

**2. Frontend: Block submit when exit violates ratio**

In `RoomUpdateForm.tsx`:
- When status is "Exit", disable the submit button if `!isValid` (ratio would be violated after exit)
- Change the warning color from yellow to red for exit violations
- Update button text to "Cannot Exit - Ratio Violation" when blocked

**3. Frontend: Handle server-side rejection**

In `RoomMonitor.tsx` `handleFormSubmit`:
- Check the response from `staffExitRoom` for `success: false` and display the error message via `toast.error()`

### Summary
- Database enforces ratio as the source of truth (server-side block)
- Frontend prevents submission and shows clear warning (client-side UX)
- Staff already cannot be in 2 rooms (existing logic)

