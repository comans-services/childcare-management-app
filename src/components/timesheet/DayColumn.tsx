
import React from "react";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import DayHeader from "./day-column/DayHeader";
import EntryList from "./day-column/EntryList";
import AddEntryButton from "./day-column/AddEntryButton";
import DayTotalHours from "./day-column/DayTotalHours";
import ProgressIndicator from "./day-column/ProgressIndicator";

interface DayColumnProps {
  date: Date;
  entries: TimesheetEntry[];
  projects: Project[];
  isSelected: boolean;
  targetUserId: string;
  canPerformOperations: boolean;
  onDateSelect: (date: Date) => void;
  onEditEntry: (entry: TimesheetEntry) => void;
  onDeleteEntry: (entry: TimesheetEntry) => void;
  onDialogOpen: (open: boolean) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({
  date,
  entries,
  projects,
  isSelected,
  targetUserId,
  canPerformOperations,
  onDateSelect,
  onEditEntry,
  onDeleteEntry,
  onDialogOpen,
}) => {
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours_logged, 0);

  const handleAddEntry = () => {
    onDateSelect(date);
    onDialogOpen(true);
  };

  return (
    <div
      className={`
        border rounded-xl p-4 transition-all duration-300 cursor-pointer
        ${
          isSelected
            ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
        }
      `}
      onClick={() => onDateSelect(date)}
    >
      {/* Day Header */}
      <DayHeader date={date} />

      {/* Entry List */}
      <EntryList
        entries={entries}
        projects={projects}
        canPerformOperations={canPerformOperations}
        onEditEntry={onEditEntry}
        onDeleteEntry={onDeleteEntry}
      />

      {/* Add Entry Button - only show if user can perform operations */}
      {canPerformOperations && (
        <AddEntryButton
          date={date}
          targetUserId={targetUserId}
          onAddEntry={handleAddEntry}
        />
      )}

      {/* Total Hours */}
      <DayTotalHours totalHours={totalHours} />

      {/* Progress Indicator */}
      <ProgressIndicator
        totalHours={totalHours}
        targetUserId={targetUserId}
        date={date}
      />
    </div>
  );
};

export default DayColumn;
