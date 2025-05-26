
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getCurrentWeekDates,
  getNextWeek,
  getPreviousWeek,
  formatDate,
  isToday,
} from "@/lib/date-utils";
import {
  fetchUserProjects,
  fetchTimesheetEntries,
  Project,
  TimesheetEntry,
  saveTimesheetEntry,
} from "@/lib/timesheet-service";
import { toast } from "@/hooks/use-toast";
import { DropResult } from "react-beautiful-dnd";
import WeekNavigation from "./weekly-view/WeekNavigation";
import WeeklyProgressBar from "./weekly-view/WeeklyProgressBar";
import LoadingState from "./weekly-view/LoadingState";
import SkeletonLoadingState from "./weekly-view/SkeletonLoadingState";
import ErrorState from "./weekly-view/ErrorState";
import WeekGrid from "./weekly-view/WeekGrid";
import EmptyState from "./weekly-view/EmptyState";
import TimeEntryDialog from "./TimeEntryDialog";

const WeeklyView: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(true);
  const [entriesLoading, setEntriesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [weeklyTarget] = useState(40);
  const [viewMode, setViewMode] = useState<"today" | "week">("week");
  
  // Time entry dialog state
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | undefined>(undefined);
  
  useEffect(() => {
    const dates = getCurrentWeekDates(currentDate);
    setWeekDates(dates);
  }, [currentDate]);

  const fetchProjects = async () => {
    console.log("WeeklyView: Fetching projects...");
    setProjectsLoading(true);
    
    try {
      const projectsData = await fetchUserProjects();
      console.log(`WeeklyView: Successfully fetched ${projectsData.length} projects`);
      setProjects(projectsData);
      return projectsData;
    } catch (err) {
      console.error("WeeklyView: Projects fetch error:", err);
      
      // Handle specific database policy errors
      if (err?.code === "42P17" || err?.message?.includes("infinite recursion")) {
        console.error("WeeklyView: Database policy recursion error detected");
        setError("Database configuration issue detected. Please contact your administrator.");
      } else {
        setError("Failed to load projects. Please try again.");
      }
      
      return [] as Project[];
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchEntries = async () => {
    if (!user || weekDates.length === 0) {
      console.log("WeeklyView: Cannot fetch entries - missing user or week dates");
      setEntriesLoading(false);
      return [];
    }

    console.log("WeeklyView: Fetching entries...", {
      userId: user.id,
      startDate: weekDates[0],
      endDate: weekDates[weekDates.length - 1]
    });
    
    setEntriesLoading(true);

    try {
      // Simplified fetch without user data to avoid the profiles table recursion issue
      const entriesData = await fetchTimesheetEntries(
        user.id,
        weekDates[0],
        weekDates[weekDates.length - 1],
        false // Disable user data fetching to avoid profiles table recursion
      );
      
      console.log(`WeeklyView: Successfully fetched ${entriesData.length} entries`);
      setEntries(entriesData);
      return entriesData;
    } catch (err) {
      console.error("WeeklyView: Entries fetch error:", err);
      
      // Handle specific database policy errors
      if (err?.code === "42P17" || err?.message?.includes("infinite recursion")) {
        console.error("WeeklyView: Database policy recursion error detected");
        setError("Database configuration issue detected. Please contact your administrator.");
      } else if (err?.response) {
        console.error("WeeklyView: API error response:", err.response);
        setError("Failed to load timesheet entries. Please check your connection.");
      } else {
        setError("Failed to load timesheet entries. Please try again.");
      }
      
      return [] as TimesheetEntry[];
    } finally {
      setEntriesLoading(false);
    }
  };

  const fetchData = async () => {
    if (!user) {
      console.error("WeeklyView: No user found.");
      setError("User is not authenticated.");
      setLoading(false);
      return;
    }

    console.log("WeeklyView: Starting data fetch for user ID:", user.id);
    setLoading(true);
    setError(null);

    try {
      // Fetch projects and entries in parallel but handle errors independently
      const [projectsResult, entriesResult] = await Promise.allSettled([
        fetchProjects(),
        fetchEntries()
      ]);

      // Handle projects result
      if (projectsResult.status === 'fulfilled') {
        setProjects(projectsResult.value);
      } else {
        console.error("WeeklyView: Projects fetch failed:", projectsResult.reason);
      }

      // Handle entries result
      if (entriesResult.status === 'fulfilled') {
        setEntries(entriesResult.value);
      } else {
        console.error("WeeklyView: Entries fetch failed:", entriesResult.reason);
      }

    } catch (error) {
      console.error("WeeklyView: Unexpected error during data fetch:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (weekDates.length > 0 && user) {
      fetchData();
    }
  }, [weekDates, user]);

  // Retry mechanism with exponential backoff
  const handleRetry = async () => {
    console.log(`WeeklyView: Retry attempt ${retryCount + 1}`);
    setRetryCount(prev => prev + 1);
    
    // Add a small delay for subsequent retries
    if (retryCount > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(1000 * retryCount, 5000)));
    }
    
    await fetchData();
  };

  const navigateToPreviousWeek = () => {
    setCurrentDate(getPreviousWeek(currentDate));
  };

  const navigateToNextWeek = () => {
    setCurrentDate(getNextWeek(currentDate));
  };

  const navigateToCurrentWeek = () => {
    setCurrentDate(new Date());
    if (viewMode === "today") {
      setViewMode("today");
    }
  };
  
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === "today" ? "week" : "today");
  };

  // Filter entries based on the view mode
  const filteredEntries = viewMode === "today" 
    ? entries.filter(entry => {
        if (typeof entry.entry_date === 'string') {
          const entryDate = entry.entry_date.substring(0, 10);
          return entryDate === formatDate(new Date());
        }
        return false;
      })
    : entries;

  const totalHours = filteredEntries.reduce((sum, entry) => {
    const hoursLogged = Number(entry.hours_logged) || 0;
    return sum + hoursLogged;
  }, 0);

  const progressTarget = viewMode === "today" ? 8 : weeklyTarget;

  const handleOpenEntryDialog = (date: Date, entry?: TimesheetEntry) => {
    setSelectedDate(date);
    setEditingEntry(entry);
    setEntryDialogOpen(true);
  };

  const handleSaveEntry = (savedEntry?: TimesheetEntry) => {
    fetchData(); // Refresh all data after saving
    setEntryDialogOpen(false);
    setSelectedDate(null);
    setEditingEntry(undefined);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    
    const draggedEntry = entries.find(entry => entry.id === draggableId);
    if (!draggedEntry) return;
    
    const sourceDate = weekDates[parseInt(source.droppableId)];
    const destDate = weekDates[parseInt(destination.droppableId)];
    
    if (source.droppableId === destination.droppableId) return;
    
    try {
      const updatedEntry: TimesheetEntry = {
        ...draggedEntry,
        entry_date: formatDate(destDate)
      };
      
      console.log("WeeklyView: Updating entry in database:", {
        originalEntry: draggedEntry,
        updatedEntry: updatedEntry
      });
      
      const savedEntry = await saveTimesheetEntry(updatedEntry);
      
      console.log("WeeklyView: Entry saved in database:", savedEntry);
      
      setEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === savedEntry.id ? {
            ...savedEntry,
            project: draggedEntry.project,
            user: draggedEntry.user
          } : entry
        )
      );
      
      toast({
        title: "Entry moved",
        description: `Entry moved to ${formatDate(destDate)}`,
      });
    } catch (error) {
      console.error("WeeklyView: Failed to update entry date:", error);
      toast({
        title: "Error",
        description: "Failed to move entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show skeleton loading on initial load
  if (loading && retryCount === 0) {
    return <SkeletonLoadingState />;
  }

  return (
    <div className="space-y-4 w-full max-w-full">
      <WeekNavigation 
        weekDates={weekDates}
        navigateToPreviousWeek={navigateToPreviousWeek}
        navigateToNextWeek={navigateToNextWeek}
        navigateToCurrentWeek={navigateToCurrentWeek}
        error={error}
        fetchData={handleRetry}
        viewMode={viewMode}
        toggleViewMode={toggleViewMode}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={handleRetry} />
      ) : (
        <div className="w-full max-w-full overflow-hidden">
          {projects.length === 0 ? (
            <EmptyState />
          ) : (
            <WeekGrid
              weekDates={weekDates}
              userId={user?.id || ""}
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

      {selectedDate && (
        <TimeEntryDialog
          open={entryDialogOpen}
          onOpenChange={setEntryDialogOpen}
          userId={user?.id || ""}
          date={selectedDate}
          projects={projects}
          existingEntry={editingEntry}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
};

export default WeeklyView;
