
import React from "react";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import DayHeader from "./DayHeader";
import EntryList from "./EntryList";
import AddEntryButton from "./AddEntryButton";
import DayTotalHours from "./DayTotalHours";

interface MobileDayColumnProps {
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

const MobileDayColumn: React.FC<MobileDayColumnProps> = ({
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
        border rounded-xl p-4 transition-all duration-300
        ${
          isSelected
            ? "border-primary bg-primary/5 shadow-md"
            : "border-gray-200 bg-white"
        }
      `}
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
    </div>
  );
};

export default MobileDayColumn;
