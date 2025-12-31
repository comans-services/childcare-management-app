
import React, { useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { TimesheetEntry, deleteTimesheetEntry } from "@/lib/timesheet-service";
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
import { MobileTimesheetView } from "../mobile/MobileTimesheetView";
import { isAdmin } from "@/utils/roles";
import { useSimpleWeeklySchedule } from "@/hooks/useSimpleWeeklySchedule";
import { getWeekStart } from "@/lib/date-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import EntryForm from "../EntryForm";

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

  // Get schedule data for mobile view
  const targetUserId = viewAsUserId || user?.id || "";
  const weekStartDate = getWeekStart(currentDate);
  const {
    effectiveDays,
    effectiveHours
  } = useSimpleWeeklySchedule(targetUserId, weekStartDate);

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

  // Mobile handlers
  const handleMobileCreateEntry = useCallback((date: Date) => {
    handleOpenEntryDialog(date);
  }, [handleOpenEntryDialog]);

  const handleMobileEditEntry = useCallback((entry: TimesheetEntry) => {
    const entryDate = new Date(entry.entry_date);
    handleOpenEntryDialog(entryDate, entry);
  }, [handleOpenEntryDialog]);

  const handleMobileDeleteEntry = useCallback(async (entry: TimesheetEntry) => {
    try {
      await deleteTimesheetEntry(entry.id);
      toast({
        title: "Entry deleted",
        description: "The timesheet entry has been deleted successfully.",
      });
      await fetchData();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete the entry.",
        variant: "destructive",
      });
    }
  }, [fetchData]);

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
      {/* Navigation - Only show for desktop, mobile has integrated navigation */}
      {!isMobile && (
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
      ) : isMobile ? (
        <MobileTimesheetView
          weekDates={weekDates}
          entries={entries}
          expectedHours={effectiveHours}
          expectedDays={effectiveDays}
          onCreateEntry={handleMobileCreateEntry}
          onEditEntry={handleMobileEditEntry}
          onDeleteEntry={handleMobileDeleteEntry}
        />
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

      {/* Entry Dialog */}
      {shouldShowDialogs && (
        <Dialog open={entryDialogOpen} onOpenChange={(open) => {
          if (!open) {
            clearDialogState();
            setEditingEntry(undefined);
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? "Edit Shift" : "Add Shift"}
                {selectedDate && ` - ${selectedDate.toLocaleDateString()}`}
              </DialogTitle>
            </DialogHeader>
            {selectedDate && (
              <EntryForm
                userId={effectiveUserId}
                date={selectedDate}
                existingEntry={editingEntry}
                onSave={handleSaveEntry}
                onCancel={() => {
                  clearDialogState();
                  setEditingEntry(undefined);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

    </ResponsiveContainer>
  );
};

export default WeeklyViewContainer;
