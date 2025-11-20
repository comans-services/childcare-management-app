import { useMemo } from "react";
import { TimesheetEntry } from "@/lib/timesheet-service";
import { formatDate } from "@/lib/date-utils";
import { useScheduleValidation } from "./useScheduleValidation";

interface DailyEntryValidationResult {
  canAddToDate: (date: Date) => boolean;
  getValidationMessage: (date: Date) => string;
  hasEntryOnDate: (date: Date) => boolean;
}

export const useDailyEntryValidation = (
  entries: TimesheetEntry[],
  userId?: string
): DailyEntryValidationResult => {
  const entriesByDate = useMemo(() => {
    const map = new Map<string, TimesheetEntry>();
    entries.forEach(entry => {
      const dateStr = String(entry.entry_date).substring(0, 10);
      map.set(dateStr, entry);
    });
    return map;
  }, [entries]);

  const hasEntryOnDate = (date: Date): boolean => {
    const dateStr = formatDate(date);
    return entriesByDate.has(dateStr);
  };

  const canAddToDate = (date: Date): boolean => {
    // Check if entry already exists for this date
    if (hasEntryOnDate(date)) return false;
    
    // If userId provided, check schedule validation
    if (userId) {
      const scheduleValidation = useScheduleValidation(userId, date);
      if (!scheduleValidation.canLogHours) return false;
    }
    
    return true;
  };

  const getValidationMessage = (date: Date): string => {
    if (hasEntryOnDate(date)) {
      return `You already have a shift logged for this day. You can edit or delete the existing entry.`;
    }
    
    // Check schedule validation if userId provided
    if (userId) {
      const scheduleValidation = useScheduleValidation(userId, date);
      if (!scheduleValidation.canLogHours) {
        return scheduleValidation.validationMessage;
      }
    }
    
    return "";
  };

  return {
    canAddToDate,
    getValidationMessage,
    hasEntryOnDate,
  };
};
