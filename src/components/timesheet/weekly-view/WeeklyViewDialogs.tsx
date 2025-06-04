
import React from "react";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import { ContractTimeEntry } from "@/lib/contract-service";
import TimeEntryDialog from "../TimeEntryDialog";

interface WeeklyViewDialogsProps {
  userId: string;
  selectedDate: Date | null;
  entryDialogOpen: boolean;
  setEntryDialogOpen: (open: boolean) => void;
  projects: Project[];
  editingEntry: TimesheetEntry | ContractTimeEntry | undefined;
  onSave: (savedEntry?: TimesheetEntry | ContractTimeEntry) => void;
}

const WeeklyViewDialogs: React.FC<WeeklyViewDialogsProps> = ({
  userId,
  selectedDate,
  entryDialogOpen,
  setEntryDialogOpen,
  projects,
  editingEntry,
  onSave,
}) => {
  if (!selectedDate) return null;

  return (
    <TimeEntryDialog
      open={entryDialogOpen}
      onOpenChange={setEntryDialogOpen}
      userId={userId}
      date={selectedDate}
      projects={projects}
      existingEntry={editingEntry}
      onSave={onSave}
    />
  );
};

export default WeeklyViewDialogs;
