
import React, { useState } from "react";
import { formatDate, getWeekStart } from "@/lib/date-utils";
import { TimesheetEntry, Project, deleteTimesheetEntry } from "@/lib/timesheet-service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useWorkingDaysValidation } from "@/hooks/useWorkingDaysValidation";
import { useWeekendLock } from "@/hooks/useWeekendLock";
import { useHolidayLock } from "@/hooks/useHolidayLock";
import { isWeekend } from "@/lib/date-utils";
import { sortEntriesByTime } from "@/lib/time-sorting-utils";
import DayHeader from "./day-column/DayHeader";
import EntryList from "./day-column/EntryList";
import DeleteConfirmDialog from "./day-column/DeleteConfirmDialog";
import AddEntryButton from "./day-column/AddEntryButton";
import DayTotalHours from "./day-column/DayTotalHours";
import { useEffect, useState as useStateHook } from "react";

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
  const [holidayInfo, setHolidayInfo] = useStateHook<{ isHoliday: boolean; holidayName?: string }>({ isHoliday: false });
  const dailyTarget = 8;

  // Get working days validation
  const weekStart = getWeekStart(date);
  const validation = useWorkingDaysValidation(userId, entries, weekStart);

  // Get weekend lock validation
  const { validateWeekendEntry } = useWeekendLock(userId);

  // Get holiday lock validation
  const { validateHolidayEntry, canCreateHolidayEntries, checkIfHoliday, isAdmin } = useHolidayLock(userId);

  const formattedColumnDate = formatDate(date);

  // Check if date is a holiday
  useEffect(() => {
    const checkHoliday = async () => {
      const result = await checkIfHoliday(date);
      setHolidayInfo(result);
    };
    
    checkHoliday();
  }, [date, checkIfHoliday]);

  // Filter entries for this day and sort by time
  const dayEntries = sortEntriesByTime(
    entries.filter(entry => {
      if (typeof entry.entry_date === 'string') {
        const entryDate = entry.entry_date.substring(0, 10);
        const matches = entryDate === formattedColumnDate;
        return matches;
      }
      return false;
    })
  );

  const totalHours = dayEntries.reduce(
    (sum, entry) => sum + entry.hours_logged,
    0
  );

  const dayProgress = Math.min((totalHours / dailyTarget) * 100, 100);

  // Check if this day can accept new entries (working days + weekend validation)
  const canAddToThisDay = validation.canAddToDate(date);
  const hasEntries = dayEntries.length > 0;
  
  // Weekend-specific validation
  const isWeekendDay = isWeekend(date);
  const weekendValidation = validateWeekendEntry(date);
  const isWeekendBlocked = isWeekendDay && !weekendValidation.isValid;

  // Holiday-specific validation
  const isHolidayDate = holidayInfo.isHoliday;
  const isHolidayBlocked = isHolidayDate && !canCreateHolidayEntries && !isAdmin;

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

  // Enhanced add entry handler with holiday validation
  const handleAddEntry = async () => {
    if (!canAddToThisDay) {
      toast({
        title: "Cannot add entry",
        description: validation.getValidationMessage(),
        variant: "destructive",
      });
      return;
    }

    if (isWeekendBlocked) {
      toast({
        title: "Weekend Entry Blocked",
        description: weekendValidation.message || "Weekend entries are not allowed.",
        variant: "destructive",
      });
      return;
    }

    // Check holiday validation
    if (isHolidayDate) {
      const holidayValidation = await validateHolidayEntry(date);
      if (!holidayValidation.isValid) {
        toast({
          title: "Holiday Entry Blocked",
          description: holidayValidation.message || "Holiday entries are not allowed.",
          variant: "destructive",
        });
        return;
      }
    }

    onAddEntry();
  };

  // Determine if day should be visually blocked
  const isDayBlocked = (!canAddToThisDay && !hasEntries) || (isWeekendBlocked && !hasEntries) || (isHolidayBlocked && !hasEntries);

  return (
    <div className="flex flex-col h-full min-w-0 w-full max-w-full">
      <DayHeader date={date} />
      
      <div className={cn(
        "h-full flex-grow overflow-hidden bg-background border border-t-0 rounded-b-md shadow-sm",
        // Enhanced visual styling for blocked days
        isDayBlocked && "bg-gray-50 border-dashed opacity-75",
        // Special holiday styling when blocked
        isHolidayBlocked && !hasEntries && "bg-red-50 border-red-200 border-dashed",
        // Special weekend styling when blocked
        isWeekendBlocked && !hasEntries && "bg-red-50 border-red-200 border-dashed",
        // Holiday day indicator (subtle for allowed holiday days)
        isHolidayDate && !isHolidayBlocked && "bg-purple-50",
        // Weekend day indicator (subtle for allowed weekend days)
        isWeekendDay && !isWeekendBlocked && !isHolidayDate && "bg-blue-50"
      )}>
        <ScrollArea className="h-[50vh] md:h-[60vh]">
          <div className="flex flex-col p-2 space-y-2 min-w-0">
            <AddEntryButton 
              onClick={handleAddEntry}
              disabled={isDayBlocked}
              className={cn(
                isDayBlocked && "opacity-50 cursor-not-allowed"
              )}
            />

            {/* Enhanced status messages for blocked days */}
            {!canAddToThisDay && !hasEntries && (
              <div className="text-xs text-muted-foreground text-center p-2 bg-amber-50 rounded border">
                Day limit reached
              </div>
            )}

            {isHolidayBlocked && !hasEntries && (
              <div className="text-xs text-red-600 text-center p-2 bg-red-50 rounded border border-red-200">
                <div className="font-medium">{holidayInfo.holidayName}</div>
                <div>Holiday entries disabled</div>
              </div>
            )}

            {isHolidayDate && !isHolidayBlocked && !hasEntries && (
              <div className="text-xs text-purple-600 text-center p-2 bg-purple-50 rounded border border-purple-200">
                <div className="font-medium">{holidayInfo.holidayName}</div>
                <div>{isAdmin ? "Admin can create entries" : "Holiday entries allowed"}</div>
              </div>
            )}

            {isWeekendBlocked && !isHolidayDate && !hasEntries && (
              <div className="text-xs text-red-600 text-center p-2 bg-red-50 rounded border border-red-200">
                Weekend entries disabled
              </div>
            )}

            {isWeekendDay && !isWeekendBlocked && !isHolidayDate && !hasEntries && (
              <div className="text-xs text-blue-600 text-center p-2 bg-blue-50 rounded border border-blue-200">
                Weekend day
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
