import { useMemo } from "react";
import { TimesheetEntry } from "@/lib/timesheet-service";
import { formatDate } from "@/lib/date-utils";

interface DailyEntryValidationResult {
  canAddToDate: (date: Date) => boolean;
  getValidationMessage: (date: Date) => string;
  hasEntryOnDate: (date: Date) => boolean;
  isDayScheduled: (date: Date) => boolean;
}

export const useDailyEntryValidation = (
  entries: TimesheetEntry[],
  effectiveDailyHours?: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  }
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

  const isDayScheduled = (date: Date): boolean => {
    if (!effectiveDailyHours) return true; // If no schedule data, allow all days
    
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const dayName = dayNames[dayOfWeek];
    
    return effectiveDailyHours[dayName] > 0;
  };

  const canAddToDate = (date: Date): boolean => {
    // Can only add if no entry exists for this date AND day is scheduled
    if (hasEntryOnDate(date)) return false;
    if (!isDayScheduled(date)) return false;
    return true;
  };

  const getValidationMessage = (date: Date): string => {
    if (hasEntryOnDate(date)) {
      return `You already have a shift logged for this day. You can edit or delete the existing entry.`;
    }
    if (!isDayScheduled(date)) {
      return `You are not scheduled to work on this day.`;
    }
    return "";
  };

  return {
    canAddToDate,
    getValidationMessage,
    hasEntryOnDate,
    isDayScheduled,
  };
};
