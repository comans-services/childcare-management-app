

## Plan: Fix `NodeJS.Timeout` TypeScript Build Errors

### Problem
Five files use `NodeJS.Timeout` as a type, but the `NodeJS` namespace is not available in the browser/Vite TypeScript configuration. This causes build errors.

### Solution
Replace `NodeJS.Timeout` with `ReturnType<typeof setTimeout>` in all five files. This is the standard browser-compatible approach.

### Files to Modify

1. **`src/hooks/use-debounce.tsx`** (line 40)
   - `NodeJS.Timeout | null` → `ReturnType<typeof setTimeout> | null`

2. **`src/hooks/use-throttle.tsx`** (line 16)
   - `NodeJS.Timeout | null` → `ReturnType<typeof setTimeout> | null`

3. **`src/hooks/usePerformanceOptimization.tsx`** (line 22)
   - `NodeJS.Timeout` → `ReturnType<typeof setTimeout>`

4. **`src/hooks/useSmoothTransitions.tsx`** (line 20)
   - `NodeJS.Timeout` → `ReturnType<typeof setTimeout>`

5. **`src/components/ui/date-range-picker/hooks/useDateRangePicker.tsx`** (line 10)
   - `NodeJS.Timeout` → `ReturnType<typeof setTimeout>`

### Impact
- Fixes all 5 typecheck errors
- No behavioral changes — purely a type annotation fix

