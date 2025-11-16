
import { useMemo } from "react";
import { TimesheetEntry } from "@/lib/timesheet-service";
import { useWeeklyWorkSchedule } from "@/hooks/useWeeklyWorkSchedule";
import { formatDate, getWeekStart } from "@/lib/date-utils";

interface WorkingDaysValidationResult {
  daysWorked: number;
  daysAllowed: number;
  daysRemaining: number;
  isAtLimit: boolean;
  canAddToDate: (date: Date) => boolean;
  getValidationMessage: () => string;
}

export const useWorkingDaysValidation = (
  userId: string,
  entries: TimesheetEntry[],
  currentWeekStart: Date
): WorkingDaysValidationResult => {
  const { effectiveDays } = useWeeklyWorkSchedule(userId, currentWeekStart);

  const validationResult = useMemo(() => {
    // Get unique days that have entries in the current week
    const weekStartStr = formatDate(getWeekStart(currentWeekStart));
    const weekEndStr = formatDate(new Date(getWeekStart(currentWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000));
    
    const daysWithEntries = new Set<string>();
    
    entries.forEach(entry => {
      const entryDateStr = String(entry.entry_date).substring(0, 10);
      if (entryDateStr >= weekStartStr && entryDateStr <= weekEndStr) {
        daysWithEntries.add(entryDateStr);
      }
    });

    const daysWorked = daysWithEntries.size;
    const daysAllowed = effectiveDays;
    const daysRemaining = Math.max(0, daysAllowed - daysWorked);
    const isAtLimit = daysWorked >= daysAllowed;

    const canAddToDate = (date: Date): boolean => {
      const dateStr = formatDate(date);
      
      // Always allow adding to days that already have entries
      if (daysWithEntries.has(dateStr)) {
        return true;
      }
      
      // Allow adding to new days only if under the limit
      return !isAtLimit;
    };

    const getValidationMessage = (): string => {
      if (daysRemaining > 0) {
        return `You can log time for ${daysRemaining} more day${daysRemaining > 1 ? 's' : ''} this week`;
      } else if (isAtLimit) {
        return `You've reached your ${daysAllowed}-day limit for this week. You can only edit existing entries or remove entries to free up days.`;
      }
      return "";
    };

    return {
      daysWorked,
      daysAllowed,
      daysRemaining,
      isAtLimit,
      canAddToDate,
      getValidationMessage,
    };
  }, [entries, effectiveDays, currentWeekStart]);

  return validationResult;
};
