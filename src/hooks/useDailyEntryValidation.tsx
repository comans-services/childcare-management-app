import { useMemo } from "react";
import { TimesheetEntry } from "@/lib/timesheet-service";
import { formatDate } from "@/lib/date-utils";

interface DailyEntryValidationResult {
  canAddToDate: (date: Date) => boolean;
  getValidationMessage: (date: Date) => string;
  hasEntryOnDate: (date: Date) => boolean;
}

export const useDailyEntryValidation = (
  entries: TimesheetEntry[]
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
    // Only check if entry already exists for this date
    return !hasEntryOnDate(date);
  };

  const getValidationMessage = (date: Date): string => {
    if (hasEntryOnDate(date)) {
      return `You already have a shift logged for this day. You can edit or delete the existing entry.`;
    }
    return "";
  };

  return {
    canAddToDate,
    getValidationMessage,
    hasEntryOnDate,
  };
};
