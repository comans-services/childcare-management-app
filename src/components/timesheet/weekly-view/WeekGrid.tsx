
import React from "react";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import DayColumn from "../DayColumn";
import { getWeekDates } from "@/lib/date-utils";

interface WeekGridProps {
  entries: TimesheetEntry[];
  projects: Project[];
  selectedDate: Date;
  weekStartDate: Date;
  workingDays: number;
  targetUserId: string;
  canPerformOperations: boolean;
  onDateSelect: (date: Date) => void;
  onEditEntry: (entry: TimesheetEntry) => void;
  onDeleteEntry: (entry: TimesheetEntry) => void;
  onDialogOpen: (open: boolean) => void;
}

const WeekGrid: React.FC<WeekGridProps> = ({
  entries,
  projects,
  selectedDate,
  weekStartDate,
  workingDays,
  targetUserId,
  canPerformOperations,
  onDateSelect,
  onEditEntry,
  onDeleteEntry,
  onDialogOpen,
}) => {
  const weekDates = getWeekDates(weekStartDate).slice(0, workingDays);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-7 gap-4 lg:gap-6">
      {weekDates.map((date) => (
        <DayColumn
          key={date.toDateString()}
          date={date}
          entries={entries.filter(
            (entry) => entry.entry_date === date.toISOString().split("T")[0]
          )}
          projects={projects}
          isSelected={selectedDate?.toDateString() === date.toDateString()}
          targetUserId={targetUserId}
          canPerformOperations={canPerformOperations}
          onDateSelect={onDateSelect}
          onEditEntry={onEditEntry}
          onDeleteEntry={onDeleteEntry}
          onDialogOpen={onDialogOpen}
        />
      ))}
    </div>
  );
};

export default WeekGrid;
