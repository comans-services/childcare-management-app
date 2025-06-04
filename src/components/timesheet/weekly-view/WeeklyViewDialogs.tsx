
import React from "react";
import TimeEntryDialog from "../TimeEntryDialog";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";

interface WeeklyViewDialogsProps {
  userId: string;
  selectedDate: Date | null;
  entryDialogOpen: boolean;
  setEntryDialogOpen: (open: boolean) => void;
  projects: Project[];
  editingEntry?: TimesheetEntry;
  onSave: (savedEntry?: TimesheetEntry) => void;
}

const WeeklyViewDialogs: React.FC<WeeklyViewDialogsProps> = ({
  userId,
  selectedDate,
  entryDialogOpen,
  setEntryDialogOpen,
  editingEntry,
  onSave,
}) => {
  return (
    <>
      {selectedDate && (
        <TimeEntryDialog
          open={entryDialogOpen}
          onOpenChange={setEntryDialogOpen}
          userId={userId}
          date={selectedDate}
          existingEntry={editingEntry}
          onSave={onSave}
        />
      )}
    </>
  );
};

export default WeeklyViewDialogs;
