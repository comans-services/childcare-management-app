
import React from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import { useIsMobile } from "@/hooks/use-mobile";
import WeekGrid from "./WeekGrid";
import MobileWeekGrid from "./MobileWeekGrid";
import WeeklyHoursSummary from "./WeeklyHoursSummary";
import MobileWeeklyHoursSummary from "./MobileWeeklyHoursSummary";
import EmptyState from "./EmptyState";

interface WeeklyViewContentProps {
  weekDates: Date[];
  currentDate: Date;
  viewMode: "calendar" | "list";
  entries: TimesheetEntry[];
  projects: Project[];
  userId: string;
  onEntryChange: () => void;
  onAddEntry?: (date: Date, entry?: TimesheetEntry) => void;
  onEditEntry?: (date: Date, entry: TimesheetEntry) => void;
  onDragEnd: (result: DropResult) => void;
}

const WeeklyViewContent: React.FC<WeeklyViewContentProps> = ({
  weekDates,
  currentDate,
  viewMode,
  entries,
  projects,
  userId,
  onEntryChange,
  onAddEntry,
  onEditEntry,
  onDragEnd,
}) => {
  const isMobile = useIsMobile();
  
  // Calculate total hours for the week
  const weekTotalHours = entries.reduce((total, entry) => total + entry.hours_logged, 0);
  
  // Show empty state if no entries and no add capability (read-only mode)
  if (entries.length === 0 && !onAddEntry) {
    return <EmptyState message="No time entries found for this week" />;
  }

  // Convert viewMode to the format expected by grid components
  const gridViewMode: "today" | "week" = viewMode === "list" ? "today" : "week";

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="space-y-6">
        {/* Hours Summary */}
        {isMobile ? (
          <MobileWeeklyHoursSummary 
            entries={entries} 
            totalHours={weekTotalHours}
          />
        ) : (
          <WeeklyHoursSummary 
            entries={entries} 
            totalHours={weekTotalHours}
          />
        )}

        {/* Week Grid */}
        {isMobile ? (
          <MobileWeekGrid
            weekDates={weekDates}
            currentDate={currentDate}
            userId={userId}
            viewMode={gridViewMode}
            entries={entries}
            projects={projects}
            onEntryChange={onEntryChange}
            onAddEntry={onAddEntry}
            onEditEntry={onEditEntry}
          />
        ) : (
          <WeekGrid
            weekDates={weekDates}
            currentDate={currentDate}
            userId={userId}
            viewMode={gridViewMode}
            entries={entries}
            projects={projects}
            onEntryChange={onEntryChange}
            onDragEnd={onDragEnd}
            onAddEntry={onAddEntry}
            onEditEntry={onEditEntry}
          />
        )}
      </div>
    </DragDropContext>
  );
};

export default WeeklyViewContent;
