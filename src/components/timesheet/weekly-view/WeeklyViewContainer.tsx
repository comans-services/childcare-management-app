
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
import { isAdmin } from "@/utils/roles";

interface WeeklyViewContainerProps {
  viewAsUserId?: string | null;
}

const WeeklyViewContainer: React.FC<WeeklyViewContainerProps> = ({ viewAsUserId }) => {
  const { user, session, userRole } = useAuth();
  const isMobile = useIsMobile();
  const { getTransitionClass } = useSmoothTransitions();
  const [isAdminUser, setIsAdminUser] = React.useState(false);

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
    entries,
    loading,
    error,
    fetchData,
    clearComponentState,
  } = useWeeklyViewData(weekDates, viewAsUserId);

  const { handleDragEnd } = useEntryOperations(weekDates, entries, () => fetchData(), user?.id);

  const [editingEntry, setEditingEntry] = React.useState<TimesheetEntry | undefined>(undefined);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const adminStatus = await isAdmin(user);
        setIsAdminUser(adminStatus);
      }
    };
    checkAdminStatus();
  }, [user]);

  // Track user changes and viewAs changes to force state cleanup
  useEffect(() => {
    const currentUserId = user?.id || null;
    const currentViewAsUserId = viewAsUserId || null;
    
    // Create a composite key to track both authenticated user and viewing user changes
    const currentCompositeKey = `${currentUserId}:${currentViewAsUserId}`;
    
    if (lastUserId !== currentCompositeKey) {
      console.log(`User or viewAs changed from ${lastUserId} to ${currentCompositeKey}`);
      clearComponentState();
      clearDialogState();
      setEditingEntry(undefined);
      setLastUserId(currentCompositeKey);
    }
  }, [user?.id, viewAsUserId, lastUserId, clearComponentState, clearDialogState, setLastUserId]);

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

  // Determine the effective user ID for operations
  const effectiveUserId = viewAsUserId || user.id;

  // Determine if dialogs should be shown
  // Show dialogs if:
  // 1. User is viewing their own timesheet (no viewAsUserId)
  // 2. User is admin and viewing someone else's timesheet
  const shouldShowDialogs = !viewAsUserId || isAdminUser;

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
          onEntryChange={fetchData}
          onAddEntry={handleOpenEntryDialog}
          onEditEntry={handleOpenEntryDialog}
          onDragEnd={handleDragEnd}
        />
      )}

    </ResponsiveContainer>
  );
};

export default WeeklyViewContainer;
