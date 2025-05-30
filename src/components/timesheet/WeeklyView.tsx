
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getCurrentWeekDates,
  getNextWeek,
  getPreviousWeek,
  isToday,
} from "@/lib/date-utils";
import { TimesheetEntry } from "@/lib/timesheet-service";
import WeekNavigation from "./weekly-view/WeekNavigation";
import WeeklyProgressBar from "./weekly-view/WeeklyProgressBar";
import LoadingState from "./weekly-view/LoadingState";
import ErrorState from "./weekly-view/ErrorState";
import WeekGrid from "./weekly-view/WeekGrid";
import EmptyState from "./weekly-view/EmptyState";
import WeeklyViewDialogs from "./weekly-view/WeeklyViewDialogs";
import { useWeeklyViewState } from "./weekly-view/hooks/useWeeklyViewState";
import { useWeeklyViewData } from "./weekly-view/hooks/useWeeklyViewData";
import { useEntryOperations } from "./weekly-view/hooks/useEntryOperations";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";

const WeeklyView: React.FC = () => {
  const { user, session } = useAuth();
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  
  // Use the updated useWorkSchedule hook for the current user
  const { workingDays, weeklyTarget, loading: scheduleLoading } = useWorkSchedule();
  
  const {
    currentDate,
    setCurrentDate,
    viewMode,
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
  } = useWeeklyViewState();

  const {
    projects,
    entries,
    loading,
    error,
    fetchData,
    clearComponentState,
  } = useWeeklyViewData(weekDates);

  const { handleDragEnd } = useEntryOperations(weekDates, entries, () => fetchData(), user?.id);

  // Track user changes to force state cleanup
  useEffect(() => {
    const currentUserId = user?.id || null;
    
    if (lastUserId !== currentUserId) {
      console.log(`User changed from ${lastUserId} to ${currentUserId}`);
      clearComponentState();
      clearDialogState();
      setLastUserId(currentUserId);
    }
  }, [user?.id, lastUserId, clearComponentState, clearDialogState, setLastUserId]);

  useEffect(() => {
    const dates = getCurrentWeekDates(currentDate);
    setWeekDates(dates);
  }, [currentDate]);

  useEffect(() => {
    if (weekDates.length > 0 && user?.id && session) {
      fetchData();
    }
  }, [fetchData, weekDates, user?.id, session]);

  const navigateToPreviousWeek = useCallback(() => {
    setCurrentDate(getPreviousWeek(currentDate));
  }, [currentDate, setCurrentDate]);

  const navigateToNextWeek = useCallback(() => {
    setCurrentDate(getNextWeek(currentDate));
  }, [currentDate, setCurrentDate]);

  const navigateToCurrentWeek = useCallback(() => {
    setCurrentDate(new Date());
  }, [setCurrentDate]);

  // Filter entries based on the view mode
  const filteredEntries = viewMode === "today" 
    ? entries.filter(entry => {
        if (typeof entry.entry_date === 'string') {
          const entryDate = entry.entry_date.substring(0, 10);
          return entryDate === new Date().toISOString().substring(0, 10);
        }
        return false;
      })
    : entries;

  const totalHours = filteredEntries.reduce((sum, entry) => {
    const hoursLogged = Number(entry.hours_logged) || 0;
    return sum + hoursLogged;
  }, 0);

  // Calculate the target based on view mode
  const progressTarget = viewMode === "today" ? (workingDays > 0 ? 8 : 0) : weeklyTarget;

  // Handler for opening the entry dialog
  const handleOpenEntryDialog = useCallback((date: Date, entry?: TimesheetEntry) => {
    setSelectedDate(date);
    setEditingEntry(entry);
    setEntryDialogOpen(true);
  }, [setSelectedDate, setEditingEntry, setEntryDialogOpen]);

  // Handler for saving an entry
  const handleSaveEntry = useCallback((savedEntry?: TimesheetEntry) => {
    fetchData(); // Refresh all data after saving
    clearDialogState();
  }, [fetchData, clearDialogState]);

  // Security validation before rendering
  if (!user?.id || !session) {
    return <div className="text-center text-gray-500">Please sign in to view your timesheet.</div>;
  }

  // Show loading state while work schedule is loading
  if (scheduleLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-4 w-full max-w-full">
      <WeekNavigation 
        weekDates={weekDates}
        navigateToPreviousWeek={navigateToPreviousWeek}
        navigateToNextWeek={navigateToNextWeek}
        navigateToCurrentWeek={navigateToCurrentWeek}
        error={error}
        fetchData={fetchData}
        viewMode={viewMode}
        toggleViewMode={toggleViewMode}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={fetchData} />
      ) : (
        <div className="w-full max-w-full overflow-hidden">
          {projects.length === 0 ? (
            <EmptyState />
          ) : (
            <WeekGrid
              weekDates={weekDates}
              userId={user.id}
              entries={entries}
              projects={projects}
              onEntryChange={fetchData}
              onDragEnd={handleDragEnd}
              onAddEntry={handleOpenEntryDialog}
              onEditEntry={handleOpenEntryDialog}
              viewMode={viewMode}
            />
          )}
        </div>
      )}

      {!loading && !error && filteredEntries.length > 0 && (
        <WeeklyProgressBar 
          totalWeekHours={totalHours} 
          weeklyTarget={progressTarget} 
        />
      )}

      <WeeklyViewDialogs
        userId={user.id}
        selectedDate={selectedDate}
        entryDialogOpen={entryDialogOpen}
        setEntryDialogOpen={setEntryDialogOpen}
        projects={projects}
        editingEntry={editingEntry}
        onSave={handleSaveEntry}
      />
    </div>
  );
};

export default WeeklyView;
