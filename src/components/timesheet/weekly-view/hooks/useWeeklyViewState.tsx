
import { useState, useCallback, useEffect } from "react";
import { TimesheetEntry } from "@/lib/timesheet-service";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";

export const useWeeklyViewState = () => {
  const { workingDays, weeklyTarget, updateWorkingDays } = useWorkSchedule();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"today" | "week">("week");
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  
  // Time entry dialog state
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | undefined>(undefined);

  // Clear all dialog state
  const clearDialogState = useCallback(() => {
    setEntryDialogOpen(false);
    setSelectedDate(null);
    setEditingEntry(undefined);
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode(prevMode => prevMode === "today" ? "week" : "today");
  }, []);

  const handleWorkingDaysChange = useCallback((days: number) => {
    updateWorkingDays(days);
  }, [updateWorkingDays]);

  return {
    currentDate,
    setCurrentDate,
    workingDays,
    weeklyTarget,
    handleWorkingDaysChange,
    viewMode,
    setViewMode,
    toggleViewMode,
    lastUserId,
    setLastUserId,
    entryDialogOpen,
    setEntryDialogOpen,
    selectedDate,
    setSelectedDate,
    editingEntry,
    setEditingEntry,
    clearDialogState,
  };
};
