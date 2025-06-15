
import { useCallback } from "react";
import { DropResult } from "react-beautiful-dnd";
import { TimesheetEntry, saveTimesheetEntry } from "@/lib/timesheet-service";
import { formatDate } from "@/lib/date-utils";
import { toast } from "@/hooks/use-toast";

export const useEntryOperations = (
  weekDates: Date[],
  entries: TimesheetEntry[],
  onEntriesChange: () => void,
  userId: string | undefined
) => {
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination || !userId) return;
    
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
      
      // Call the refresh function instead of direct state setting
      onEntriesChange();
      
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
  }, [weekDates, entries, onEntriesChange, userId]);

  return {
    handleDragEnd,
  };
};
