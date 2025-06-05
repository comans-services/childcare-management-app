
import React, { useState } from "react";
import { formatDate, getWeekStart } from "@/lib/date-utils";
import { TimesheetEntry, Project, deleteTimesheetEntry } from "@/lib/timesheet-service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useWorkingDaysValidation } from "@/hooks/useWorkingDaysValidation";
import DayHeader from "./day-column/DayHeader";
import EntryList from "./day-column/EntryList";
import DeleteConfirmDialog from "./day-column/DeleteConfirmDialog";
import AddEntryButton from "./day-column/AddEntryButton";
import DayTotalHours from "./day-column/DayTotalHours";
import ProgressIndicator from "./day-column/ProgressIndicator";

interface DayColumnProps {
  date: Date;
  userId: string;
  entries: TimesheetEntry[];
  projects: Project[];
  onEntryChange: () => void;
  droppableId: string;
  onAddEntry: () => void;
  onEditEntry: (entry: TimesheetEntry) => void;
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
  const [entryToDelete, setEntryToDelete] = useState<TimesheetEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dailyTarget = 8;

  // Get working days validation
  const weekStart = getWeekStart(date);
  const validation = useWorkingDaysValidation(userId, entries, weekStart);

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

  const dayProgress = Math.min((totalHours / dailyTarget) * 100, 100);

  const getProgressColor = () => {
    if (dayProgress < 30) return "bg-amber-500";
    if (dayProgress < 70) return "bg-blue-500";
    if (dayProgress < 100) return "bg-emerald-500";
    return "bg-violet-500";
  };

  // Check if this day can accept new entries
  const canAddToThisDay = validation.canAddToDate(date);
  const hasEntries = dayEntries.length > 0;

  const handleDeleteClick = (entry: TimesheetEntry) => {
    setEntryToDelete(entry);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete || !entryToDelete.id) return;
    
    try {
      setIsDeleting(true);
      await deleteTimesheetEntry(entryToDelete.id);
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

  // Enhanced add entry handler with validation
  const handleAddEntry = () => {
    if (!canAddToThisDay) {
      toast({
        title: "Cannot add entry",
        description: validation.getValidationMessage(),
        variant: "destructive",
      });
      return;
    }
    onAddEntry();
  };

  return (
    <div className="flex flex-col h-full min-w-0 w-full max-w-full">
      <DayHeader date={date} />
      
      <div className={cn(
        "h-full flex-grow overflow-hidden bg-background border border-t-0 rounded-b-md shadow-sm",
        // Add visual indication for blocked days
        !canAddToThisDay && !hasEntries && "bg-gray-50 border-dashed opacity-75"
      )}>
        <ScrollArea className="h-[50vh] md:h-[60vh]">
          <div className="flex flex-col p-2 space-y-2 min-w-0">
            <AddEntryButton 
              onClick={handleAddEntry}
              disabled={!canAddToThisDay}
              className={cn(
                !canAddToThisDay && !hasEntries && "opacity-50 cursor-not-allowed"
              )}
            />

            {/* Show working days limit info for blocked days */}
            {!canAddToThisDay && !hasEntries && (
              <div className="text-xs text-muted-foreground text-center p-2 bg-amber-50 rounded border">
                Day limit reached
              </div>
            )}

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
