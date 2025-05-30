
import { useState, useEffect } from "react";

export const useWorkSchedule = () => {
  const [workingDays, setWorkingDays] = useState<number>(() => {
    // Load from localStorage or default to 5 days
    const saved = localStorage.getItem("timesheet-working-days");
    return saved ? parseInt(saved) : 5;
  });

  // Calculate weekly target based on working days
  const weeklyTarget = workingDays * 8;

  // Save working days to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("timesheet-working-days", workingDays.toString());
  }, [workingDays]);

  const updateWorkingDays = (days: number) => {
    setWorkingDays(days);
  };

  return {
    workingDays,
    weeklyTarget,
    updateWorkingDays,
  };
};
