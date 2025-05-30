
import { useState, useEffect } from "react";

export const useWorkSchedule = (userId?: string) => {
  // Create user-specific localStorage key, fallback to current user's key
  const storageKey = userId ? `timesheet-working-days-${userId}` : "timesheet-working-days";
  
  const [workingDays, setWorkingDays] = useState<number>(() => {
    // Load from localStorage or default to 5 days
    const saved = localStorage.getItem(storageKey);
    return saved && !isNaN(parseInt(saved)) ? parseInt(saved) : 5;
  });

  // Calculate weekly target based on working days
  const weeklyTarget = workingDays * 8;

  // Save working days to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(storageKey, workingDays.toString());
  }, [workingDays, storageKey]);

  const updateWorkingDays = (days: number) => {
    // Validate the input to ensure it's a valid number between 0 and 7
    if (days >= 0 && days <= 7 && !isNaN(days)) {
      setWorkingDays(days);
    }
  };

  return {
    workingDays,
    weeklyTarget,
    updateWorkingDays,
  };
};
