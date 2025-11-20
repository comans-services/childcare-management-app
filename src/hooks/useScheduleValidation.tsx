import { useMemo } from "react";
import { useWeeklyWorkSchedule } from "./useWeeklyWorkSchedule";
import { getWeekStart } from "@/lib/date-utils";

interface ScheduleValidationResult {
  canLogHours: boolean;
  scheduledHours: number;
  validationMessage: string;
  usingGlobalSchedule: boolean;
}

export const useScheduleValidation = (
  userId: string,
  date: Date
): ScheduleValidationResult => {
  const weekStart = useMemo(() => getWeekStart(date), [date]);
  const { weeklySchedule, effectiveDailyHours, hasWeeklyOverride } = useWeeklyWorkSchedule(userId, weekStart);

  return useMemo(() => {
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // Get scheduled hours for this specific day
    const scheduledHours = effectiveDailyHours[dayOfWeek] || 0;

    // If no weekly override exists, use global schedule (allow all days)
    if (!hasWeeklyOverride) {
      return {
        canLogHours: true,
        scheduledHours,
        validationMessage: "",
        usingGlobalSchedule: true,
      };
    }

    // Has weekly schedule - check if day has hours
    if (scheduledHours === 0) {
      return {
        canLogHours: false,
        scheduledHours: 0,
        validationMessage: `You are not scheduled to work on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`,
        usingGlobalSchedule: false,
      };
    }

    return {
      canLogHours: true,
      scheduledHours,
      validationMessage: "",
      usingGlobalSchedule: false,
    };
  }, [date, effectiveDailyHours, hasWeeklyOverride]);
};
