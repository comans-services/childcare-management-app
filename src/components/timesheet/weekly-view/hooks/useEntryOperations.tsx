
import { useCallback } from "react";
import { DropResult } from "react-beautiful-dnd";
import { TimesheetEntry, saveTimesheetEntry, AnyTimeEntry } from "@/lib/timesheet-service";
import { formatDate } from "@/lib/date-utils";
import { toast } from "@/hooks/use-toast";

export const useEntryOperations = (
  weekDates: Date[],
  entries: AnyTimeEntry[],
  refetchData: () => void,
  userId: string | undefined
) => {
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination || !userId) return;
    
    const draggedEntry = entries.find(entry => entry.id === draggableId);
    if (!draggedEntry) return;
    
    // Only allow dragging timesheet entries (not contract entries)
    if ('contract_id' in draggedEntry) {
      toast({
        title: "Cannot move contract entry",
        description: "Contract time entries cannot be moved between days.",
        variant: "destructive",
      });
      return;
    }
    
    const sourceDate = weekDates[parseInt(source.droppableId)];
    const destDate = weekDates[parseInt(destination.droppableId)];
    
    if (source.droppableId === destination.droppableId) return;
    
    try {
      const updatedEntry: TimesheetEntry = {
        ...draggedEntry as TimesheetEntry,
        entry_date: formatDate(destDate)
      };
      
      console.log("Updating entry in database:", {
        originalEntry: draggedEntry,
        updatedEntry: updatedEntry
      });
      
      const savedEntry = await saveTimesheetEntry(updatedEntry);
      
      console.log("Entry saved in database:", savedEntry);
      
      refetchData();
      
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
  }, [weekDates, entries, refetchData, userId]);

  return {
    handleDragEnd,
  };
};
