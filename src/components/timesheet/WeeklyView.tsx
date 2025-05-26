
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
  const [error, setError] = useState<string | null>(null);
  const [weeklyTarget] = useState(40); // Default weekly target of 40 hours
  const [viewMode, setViewMode] = useState<"today" | "week">("week");
  
  // Time entry dialog state
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | undefined>(undefined);
  
  useEffect(() => {
    const dates = getCurrentWeekDates(currentDate);
    setWeekDates(dates);
  }, [currentDate]);

  const fetchData = async () => {
    if (!user) {
      console.log("No user found, skipping data fetch");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Starting data fetch for user:", user.id);
      
      // Fetch projects first
      const projectsData = await fetchUserProjects();
      console.log("Successfully fetched projects:", projectsData.length);
      setProjects(projectsData);
      
      // Then fetch entries if we have valid dates
      if (weekDates.length > 0) {
        console.log("Fetching entries for date range:", weekDates[0], "to", weekDates[weekDates.length - 1]);
        const entriesData = await fetchTimesheetEntries(
          user.id,
          weekDates[0],
          weekDates[weekDates.length - 1],
          true // Include user data
        );
        
        console.log("Successfully fetched entries:", entriesData.length);
        setEntries(entriesData);
      }
    } catch (error) {
      console.error("Error fetching timesheet data:", error);
      setError(`Failed to load timesheet data: ${error.message || 'Unknown error'}`);
      
      // Show user-friendly error message
      toast({
        title: "Error loading data",
        description: "There was a problem loading your timesheet. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weekDates.length > 0 && user) {
      fetchData();
    }
  }, [weekDates, user]);

  const navigateToPreviousWeek = () => {
    setCurrentDate(getPreviousWeek(currentDate));
  };

  const navigateToNextWeek = () => {
    setCurrentDate(getNextWeek(currentDate));
  };

  const navigateToCurrentWeek = () => {
    setCurrentDate(new Date());
    // If in today view, make sure we show today's entries
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

  // Calculate the target based on view mode
  const progressTarget = viewMode === "today" ? 8 : weeklyTarget;

  // Handler for opening the entry dialog
  const handleOpenEntryDialog = (date: Date, entry?: TimesheetEntry) => {
    setSelectedDate(date);
    setEditingEntry(entry);
    setEntryDialogOpen(true);
  };

  // Handler for saving an entry
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
      
      console.log("Updating entry in database:", {
        originalEntry: draggedEntry,
        updatedEntry: updatedEntry
      });
      
      const savedEntry = await saveTimesheetEntry(updatedEntry);
      
      console.log("Entry saved in database:", savedEntry);
      
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
      console.error("Failed to update entry date:", error);
      toast({
        title: "Error",
        description: "Failed to move entry. Please try again.",
        variant: "destructive",
      });
    }
  };

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

      {/* Time Entry Dialog */}
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
