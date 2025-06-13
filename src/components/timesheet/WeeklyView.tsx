
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getCurrentWeekDates,
  getNextWeek,
  getPreviousWeek,
  getNextDay,
  getPreviousDay,
  isToday,
} from "@/lib/date-utils";
import { TimesheetEntry } from "@/lib/timesheet-service";
import WeekNavigation from "./weekly-view/WeekNavigation";
import MobileWeekNavigation from "./weekly-view/MobileWeekNavigation";
import WeeklyProgressBar from "./weekly-view/WeeklyProgressBar";
import WeeklyHoursSummary from "./weekly-view/WeeklyHoursSummary";
import MobileWeeklyHoursSummary from "./weekly-view/MobileWeeklyHoursSummary";
import LoadingState from "./weekly-view/LoadingState";
import ErrorState from "./weekly-view/ErrorState";
import WeekGrid from "./weekly-view/WeekGrid";
import MobileWeekGrid from "./weekly-view/MobileWeekGrid";
import EmptyState from "./weekly-view/EmptyState";
import WeeklyViewDialogs from "./weekly-view/WeeklyViewDialogs";
import { useWeeklyViewState } from "./weekly-view/hooks/useWeeklyViewState";
import { useWeeklyViewData } from "./weekly-view/hooks/useWeeklyViewData";
import { useEntryOperations } from "./weekly-view/hooks/useEntryOperations";
import { useSimpleWeeklySchedule } from "@/hooks/useSimpleWeeklySchedule";
import { getWeekStart } from "@/lib/date-utils";
import { LazyContent } from "@/components/common/LazyContent";
import { ResponsiveContainer } from "@/components/common/ResponsiveContainer";
import { useSmoothTransitions } from "@/hooks/useSmoothTransitions";
import { useIsMobile } from "@/hooks/use-mobile";

const WeeklyView: React.FC = () => {
  const { user, session } = useAuth();
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const isMobile = useIsMobile();
  
  // Performance and transition hooks
  const { getTransitionClass } = useSmoothTransitions();
  
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
    clearDialogState,
  } = useWeeklyViewState();

  // Update editingEntry to handle unified entry type
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | undefined>(undefined);

  // Get current week's schedule using the unified hook
  const weekStartDate = getWeekStart(currentDate);
  const {
    effectiveDays: workingDays,
    effectiveHours: weeklyTarget,
    isLoading: scheduleLoading
  } = useSimpleWeeklySchedule(user?.id || "", weekStartDate);

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
      setEditingEntry(undefined);
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

  // Updated navigation functions to handle both day and week navigation
  const navigateToPrevious = useCallback(() => {
    if (viewMode === "today") {
      setCurrentDate(getPreviousDay(currentDate));
    } else {
      setCurrentDate(getPreviousWeek(currentDate));
    }
  }, [currentDate, setCurrentDate, viewMode]);

  const navigateToNext = useCallback(() => {
    if (viewMode === "today") {
      setCurrentDate(getNextDay(currentDate));
    } else {
      setCurrentDate(getNextWeek(currentDate));
    }
  }, [currentDate, setCurrentDate, viewMode]);

  const navigateToCurrentWeek = useCallback(() => {
    setCurrentDate(new Date());
  }, [setCurrentDate]);

  // Filter entries based on the view mode
  const filteredEntries = viewMode === "today" 
    ? entries.filter(entry => {
        const entryDateString = String(entry.entry_date).substring(0, 10);
        const currentDateString = currentDate.toISOString().substring(0, 10);
        return entryDateString === currentDateString;
      })
    : entries;

  // Calculate total hours for the current week view
  const totalHours = useMemo(() => {
    return filteredEntries.reduce((sum, entry) => {
      const hoursLogged = Number(entry.hours_logged) || 0;
      return sum + hoursLogged;
    }, 0);
  }, [filteredEntries]);

  // Calculate unique days worked (any entry on a day counts as 1 day)
  const uniqueDatesWorked = new Set(
    filteredEntries.map(entry => {
      const entryDateString = String(entry.entry_date);
      return entryDateString.substring(0, 10);
    })
  );
  
  const totalDaysWorked = uniqueDatesWorked.size;

  // Calculate the target based on view mode
  const workingDaysTarget = viewMode === "today" ? 1 : workingDays;

  // Handler for opening the entry dialog
  const handleOpenEntryDialog = useCallback((date: Date, entry?: TimesheetEntry) => {
    setSelectedDate(date);
    setEditingEntry(entry);
    setEntryDialogOpen(true);
  }, [setSelectedDate, setEntryDialogOpen]);

  // Enhanced handler for saving an entry with real-time refresh
  const handleSaveEntry = useCallback(async (savedEntry?: TimesheetEntry) => {
    console.log("=== REFRESHING DATA AFTER ENTRY SAVE ===");
    
    // Force refresh all data to get updated budget calculations
    await fetchData();
    
    // Clear dialog state
    clearDialogState();
    setEditingEntry(undefined);
    
    console.log("Data refresh completed after entry save");
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
    <ResponsiveContainer 
      className={getTransitionClass("space-y-4 w-full max-w-full")}
      onResize={(width) => {
        console.log(`WeeklyView container resized to: ${width}px`);
      }}
    >
      {/* Use mobile or desktop navigation based on screen size */}
      {isMobile ? (
        <MobileWeekNavigation 
          weekDates={weekDates}
          currentDate={currentDate}
          navigateToPrevious={navigateToPrevious}
          navigateToNext={navigateToNext}
          navigateToCurrentWeek={navigateToCurrentWeek}
          error={error}
          fetchData={fetchData}
          viewMode={viewMode}
          toggleViewMode={toggleViewMode}
        />
      ) : (
        <WeekNavigation 
          weekDates={weekDates}
          currentDate={currentDate}
          navigateToPrevious={navigateToPrevious}
          navigateToNext={navigateToNext}
          navigateToCurrentWeek={navigateToCurrentWeek}
          error={error}
          fetchData={fetchData}
          viewMode={viewMode}
          toggleViewMode={toggleViewMode}
        />
      )}

      {/* Lazy load hours summary when we have entries */}
      {!loading && !error && filteredEntries.length > 0 && (
        <LazyContent
          fallback={<div className="h-20 bg-gray-100 rounded-lg animate-pulse" />}
          priority={true}
        >
          {isMobile ? (
            <MobileWeeklyHoursSummary 
              totalHours={totalHours}
              weeklyTarget={weeklyTarget}
              entries={entries}
            />
          ) : (
            <WeeklyHoursSummary 
              totalHours={totalHours}
              weeklyTarget={weeklyTarget}
              entries={entries}
            />
          )}
        </LazyContent>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={fetchData} />
      ) : (
        <LazyContent
          fallback={
            <div className="grid gap-2 grid-cols-1 md:grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          }
          priority={true}
          className="w-full max-w-full overflow-hidden"
        >
          {projects.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Use mobile or desktop grid based on screen size */}
              {isMobile ? (
                <MobileWeekGrid
                  weekDates={weekDates}
                  userId={user.id}
                  entries={entries}
                  projects={projects}
                  onEntryChange={fetchData}
                  onAddEntry={handleOpenEntryDialog}
                  onEditEntry={handleOpenEntryDialog}
                  viewMode={viewMode}
                />
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
            </>
          )}
        </LazyContent>
      )}

      {!loading && !error && filteredEntries.length > 0 && (
        <LazyContent
          fallback={<div className="h-4 bg-gray-100 rounded animate-pulse" />}
          priority={true}
        >
          <WeeklyProgressBar 
            totalDaysWorked={totalDaysWorked} 
            workingDaysTarget={workingDaysTarget} 
          />
        </LazyContent>
      )}

      <WeeklyViewDialogs
        userId={user.id}
        selectedDate={selectedDate}
        entryDialogOpen={entryDialogOpen}
        setEntryDialogOpen={setEntryDialogOpen}
        projects={projects}
        editingEntry={editingEntry}
        onSave={handleSaveEntry}
        entries={entries}
      />
    </ResponsiveContainer>
  );
};

export default WeeklyView;
