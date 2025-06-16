
import React from "react";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import MobileDayColumn from "../day-column/MobileDayColumn";
import { getWeekDates } from "@/lib/date-utils";

interface MobileWeekGridProps {
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

const MobileWeekGrid: React.FC<MobileWeekGridProps> = ({
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
    <div className="space-y-4">
      {weekDates.map((date) => (
        <MobileDayColumn
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

export default MobileWeekGrid;
