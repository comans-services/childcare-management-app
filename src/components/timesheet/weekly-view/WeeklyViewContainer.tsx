
import React, { useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { TimesheetEntry } from "@/lib/timesheet-service";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveContainer } from "@/components/common/ResponsiveContainer";
import { useSmoothTransitions } from "@/hooks/useSmoothTransitions";
import { useWeeklyNavigation } from "./hooks/useWeeklyNavigation";
import { useWeeklyViewState } from "./hooks/useWeeklyViewState";
import { useWeeklyViewData } from "./hooks/useWeeklyViewData";
import { useEntryOperations } from "./hooks/useEntryOperations";
import WeekNavigation from "./WeekNavigation";
import MobileWeekNavigation from "./MobileWeekNavigation";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import WeeklyViewContent from "./WeeklyViewContent";
import WeeklyViewDialogs from "./WeeklyViewDialogs";

const WeeklyViewContainer: React.FC = () => {
  const { user, session } = useAuth();
  const isMobile = useIsMobile();
  const { getTransitionClass } = useSmoothTransitions();

  const {
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

  const {
    currentDate,
    weekDates,
    updateWeekDates,
    navigateToPrevious,
    navigateToNext,
    navigateToCurrentWeek,
  } = useWeeklyNavigation(viewMode);

  const {
    projects,
    entries,
    loading,
    error,
    fetchData,
    clearComponentState,
  } = useWeeklyViewData(weekDates);

  const { handleDragEnd } = useEntryOperations(weekDates, entries, () => fetchData(), user?.id);

  const [editingEntry, setEditingEntry] = React.useState<TimesheetEntry | undefined>(undefined);

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

  // Update week dates when current date changes
  useEffect(() => {
    updateWeekDates();
  }, [updateWeekDates]);

  // Fetch data when dependencies change
  useEffect(() => {
    if (weekDates.length > 0 && user?.id && session) {
      fetchData();
    }
  }, [fetchData, weekDates, user?.id, session]);

  // Handler for opening the entry dialog
  const handleOpenEntryDialog = useCallback((date: Date, entry?: TimesheetEntry) => {
    setSelectedDate(date);
    setEditingEntry(entry);
    setEntryDialogOpen(true);
  }, [setSelectedDate, setEntryDialogOpen]);

  // Enhanced handler for saving an entry with real-time refresh
  const handleSaveEntry = useCallback(async (savedEntry?: TimesheetEntry) => {
    console.log("=== REFRESHING DATA AFTER ENTRY SAVE ===");
    
    await fetchData();
    clearDialogState();
    setEditingEntry(undefined);
    
    console.log("Data refresh completed after entry save");
  }, [fetchData, clearDialogState]);

  // Security validation
  if (!user?.id || !session) {
    return <div className="text-center text-gray-500">Please sign in to view your timesheet.</div>;
  }

  return (
    <ResponsiveContainer 
      className={getTransitionClass("space-y-4 w-full max-w-full")}
      onResize={(width) => {
        console.log(`WeeklyView container resized to: ${width}px`);
      }}
    >
      {/* Navigation */}
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

      {/* Main Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={fetchData} />
      ) : (
        <WeeklyViewContent
          weekDates={weekDates}
          currentDate={currentDate}
          viewMode={viewMode}
          entries={entries}
          projects={projects}
          onEntryChange={fetchData}
          onAddEntry={handleOpenEntryDialog}
          onEditEntry={handleOpenEntryDialog}
          onDragEnd={handleDragEnd}
        />
      )}

      {/* Dialogs */}
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

export default WeeklyViewContainer;
