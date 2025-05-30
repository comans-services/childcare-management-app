
import { useState, useCallback } from "react";
import { TimesheetEntry } from "@/lib/timesheet-service";

export const useWeeklyViewState = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weeklyTarget] = useState(40); // Default weekly target of 40 hours
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

  return {
    currentDate,
    setCurrentDate,
    weeklyTarget,
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
