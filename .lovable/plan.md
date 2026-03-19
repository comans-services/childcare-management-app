

## Change Over-3 Educator-to-Child Ratio from 1:15 to 1:11

### What changes

**1. Database migration** — Update the default value for `ratio_over_3` in `childcare_rooms` from 15 to 11, and update all existing rows:
```sql
ALTER TABLE childcare_rooms ALTER COLUMN ratio_over_3 SET DEFAULT 11;
UPDATE childcare_rooms SET ratio_over_3 = 11 WHERE ratio_over_3 = 15;
```
Also update any database functions that hardcode the 1:15 ratio (e.g. `get_room_status`, `current_room_status` view, `room_summary` view).

**2. Update `src/utils/childcare-monitor/roomUtils.ts`** — Change `childrenOver3 / 15` to `childrenOver3 / 11` and update the comments.

**3. Update `src/pages/childcare-monitor/ChildcareMonitorIndex.tsx`** — Change the displayed ratio text from "1:15" to "1:11".

### Files modified
- `src/utils/childcare-monitor/roomUtils.ts`
- `src/pages/childcare-monitor/ChildcareMonitorIndex.tsx`
- Database migration for default value + existing data + any functions/views using ratio 15

