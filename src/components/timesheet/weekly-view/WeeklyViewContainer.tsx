
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useWeeklyViewState } from "./hooks/useWeeklyViewState";
import { useWeeklyViewData } from "./hooks/useWeeklyViewData";
import { useWeeklyNavigation } from "./hooks/useWeeklyNavigation";
import { useEntryOperations } from "./hooks/useEntryOperations";
import WeeklyViewContent from "./WeeklyViewContent";
import WeeklyViewDialogs from "./WeeklyViewDialogs";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";

interface WeeklyViewContainerProps {
  viewAsUserId?: string | null;
}

const WeeklyViewContainer: React.FC<WeeklyViewContainerProps> = ({ viewAsUserId }) => {
  const { user, userRole } = useAuth();
  const isAdmin = userRole === "admin";
  
  // Determine the target user ID - either the selected user (for admin) or current user
  const targetUserId = viewAsUserId || user?.id || "";
  
  // State management
  const {
    selectedDate,
    setSelectedDate,
    weekStartDate,
    editingEntry,
    setEditingEntry,
    isDialogOpen,
    setIsDialogOpen,
    refreshKey,
    setRefreshKey,
    workingDays,
    setWorkingDays,
    deleteDialogState,
    setDeleteDialogState,
  } = useWeeklyViewState();

  // Data fetching
  const {
    entries,
    projects,
    isLoading,
    error,
    refetch,
  } = useWeeklyViewData(targetUserId, weekStartDate, refreshKey);

  // Navigation
  const { navigateWeek } = useWeeklyNavigation(setSelectedDate, setRefreshKey);

  // Entry operations
  const { handleSaveEntry, handleDeleteEntry } = useEntryOperations(
    targetUserId,
    refetch,
    setRefreshKey,
    setIsDialogOpen,
    setEditingEntry,
    setDeleteDialogState
  );

  // Loading and error states
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  // Admin can perform all operations on any user's timesheet
  // Regular users can only perform operations on their own timesheet
  const canPerformOperations = !viewAsUserId || isAdmin;

  return (
    <div className="space-y-6">
      <WeeklyViewContent
        entries={entries}
        projects={projects}
        selectedDate={selectedDate}
        weekStartDate={weekStartDate}
        workingDays={workingDays}
        targetUserId={targetUserId}
        canPerformOperations={canPerformOperations}
        onDateSelect={setSelectedDate}
        onEditEntry={setEditingEntry}
        onDeleteEntry={(entry) => setDeleteDialogState({ isOpen: true, entry })}
        onDialogOpen={setIsDialogOpen}
        onWorkingDaysChange={setWorkingDays}
        onNavigateWeek={navigateWeek}
      />

      {/* Show dialogs when user can perform operations (own timesheet or admin viewing others) */}
      {canPerformOperations && (
        <WeeklyViewDialogs
          isDialogOpen={isDialogOpen}
          editingEntry={editingEntry}
          selectedDate={selectedDate}
          projects={projects}
          entries={entries}
          deleteDialogState={deleteDialogState}
          targetUserId={targetUserId}
          onDialogOpenChange={setIsDialogOpen}
          onSaveEntry={handleSaveEntry}
          onDeleteEntry={handleDeleteEntry}
          onDeleteDialogStateChange={setDeleteDialogState}
          onEditingEntryChange={setEditingEntry}
        />
      )}
    </div>
  );
};

export default WeeklyViewContainer;
