// Stub hook - redirects to useWeeklyWorkSchedule
import { useWeeklyWorkSchedule } from "./useWeeklyWorkSchedule";

export const useSimpleWeeklySchedule = (userId: string, weekStartDate: Date) => {
  const { effectiveDays, effectiveHours, loading, error } = useWeeklyWorkSchedule(userId, weekStartDate);
  
  return {
    effectiveDays,
    effectiveHours,
    isLoading: loading,
    error
  };
};
