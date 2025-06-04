
import React, { useState } from "react";
import { formatDate } from "@/lib/date-utils";
import { AnyTimeEntry, Project, deleteTimesheetEntry } from "@/lib/timesheet-service";
import { deleteContractTimeEntry } from "@/lib/contract-service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import DayHeader from "./day-column/DayHeader";
import EntryList from "./day-column/EntryList";
import DeleteConfirmDialog from "./day-column/DeleteConfirmDialog";
import AddEntryButton from "./day-column/AddEntryButton";
import DayTotalHours from "./day-column/DayTotalHours";

interface DayColumnProps {
  date: Date;
  userId: string;
  entries: AnyTimeEntry[];
  projects: Project[];
  onEntryChange: () => void;
  droppableId: string;
  onAddEntry: () => void;
  onEditEntry: (entry: AnyTimeEntry) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({
  date,
  userId,
  entries,
  projects,
  onEntryChange,
  droppableId,
  onAddEntry,
  onEditEntry,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<AnyTimeEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dailyTarget = 8;

  const formattedColumnDate = formatDate(date);

  const dayEntries = entries.filter(entry => {
    if (typeof entry.entry_date === 'string') {
      const entryDate = entry.entry_date.substring(0, 10);
      const matches = entryDate === formattedColumnDate;
      return matches;
    }
    return false;
  });

  const totalHours = dayEntries.reduce(
    (sum, entry) => sum + entry.hours_logged,
    0
  );

  const handleDeleteClick = (entry: AnyTimeEntry) => {
    setEntryToDelete(entry);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete || !entryToDelete.id) return;
    
    try {
      setIsDeleting(true);
      
      // Check if it's a contract entry or timesheet entry
      if ('contract_id' in entryToDelete) {
        await deleteContractTimeEntry(entryToDelete.id);
      } else {
        await deleteTimesheetEntry(entryToDelete.id);
      }
      
      toast({
        title: "Entry deleted",
        description: "Time entry deleted successfully.",
      });
      
      onEntryChange();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete time entry.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full min-w-0 w-full max-w-full">
      <DayHeader date={date} />
      
      <div className="h-full flex-grow overflow-hidden bg-background border border-t-0 rounded-b-md shadow-sm">
        <ScrollArea className="h-[50vh] md:h-[60vh]">
          <div className="flex flex-col p-2 space-y-2 min-w-0">
            <AddEntryButton onClick={onAddEntry} />

            <EntryList
              droppableId={droppableId}
              entries={dayEntries}
              onEditEntry={onEditEntry}
              onDeleteEntry={handleDeleteClick}
              onEntryChange={onEntryChange}
            />

            <DayTotalHours totalHours={totalHours} />
          </div>
        </ScrollArea>
      </div>
      
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default DayColumn;
