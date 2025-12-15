import React, { useState } from "react";
import { formatDate, getWeekStart } from "@/lib/date-utils";
import { TimesheetEntry, Project, deleteTimesheetEntry } from "@/lib/timesheet-service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useDailyEntryValidation } from "@/hooks/useDailyEntryValidation";
import { useWeekendLock } from "@/hooks/useWeekendLock";
import { useWeeklyWorkSchedule } from "@/hooks/useWeeklyWorkSchedule";
import { isWeekend } from "@/lib/date-utils";
import { sortEntriesByTime } from "@/lib/time-sorting-utils";
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
  
  // Get weekly schedule to determine scheduled hours
  const { effectiveDailyHours } = useWeeklyWorkSchedule(userId, getWeekStart(date));
  
  // Get the scheduled hours for this specific day
  const dayOfWeek = date.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const scheduledHours = effectiveDailyHours[dayNames[dayOfWeek]];
  const dailyTarget = scheduledHours > 0 ? scheduledHours : 8;

  // Get daily entry validation with schedule awareness
  const validation = useDailyEntryValidation(entries, effectiveDailyHours);

  // Get weekend lock validation
  const { validateWeekendEntry } = useWeekendLock(userId);

  const formattedColumnDate = formatDate(date);

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

  const getProgressColor = () => {
    if (dayProgress < 30) return "bg-amber-500";
    if (dayProgress < 70) return "bg-blue-500";
    if (dayProgress < 100) return "bg-emerald-500";
    return "bg-violet-500";
  };

  // Check if this day can accept new entries (schedule + 1 per day + weekend validation)
  const canAddToThisDay = validation.canAddToDate(date);
  const hasEntries = dayEntries.length > 0;
  const isDayScheduled = validation.isDayScheduled(date);
  
  // Weekend-specific validation
  const isWeekendDay = isWeekend(date);
  const weekendValidation = validateWeekendEntry(date);
  const isWeekendBlocked = isWeekendDay && !weekendValidation.isValid;
  
  // Determine block reason for visual feedback
  const getBlockReason = (): 'not-scheduled' | 'has-entry' | 'weekend' | null => {
    if (!isDayScheduled) return 'not-scheduled';
    if (hasEntries) return 'has-entry';
    if (isWeekendBlocked) return 'weekend';
    return null;
  };

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

  // Enhanced add entry handler with both working days and weekend validation
  const handleAddEntry = () => {
    if (!canAddToThisDay) {
      toast({
        title: "Cannot add shift",
        description: validation.getValidationMessage(date),
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

    onAddEntry();
  };

  // Determine if day should be visually blocked
  const isDayBlocked = (!canAddToThisDay && !hasEntries) || (isWeekendBlocked && !hasEntries);

  return (
    <div 
      className={cn(
        "flex flex-col h-full border-2 rounded-lg overflow-hidden transition-all",
        !isDayScheduled ? "bg-muted/30 border-muted" : 
        isWeekendBlocked ? "bg-red-50 border-red-200" : "bg-card border-border",
        hasEntries && "ring-2 ring-primary/20"
      )}
    >
      <DayHeader 
        date={date} 
        isScheduled={isDayScheduled}
      />
      
      <div className="h-full flex-grow overflow-hidden">
        <ScrollArea className="h-[50vh] md:h-[60vh]">
          <div className="flex flex-col p-2 space-y-2 min-w-0">
            <AddEntryButton 
              onClick={handleAddEntry}
              disabled={!canAddToThisDay}
              blockReason={getBlockReason()}
            />

            {/* Status messages for blocked days */}
            {!isDayScheduled && !hasEntries && (
              <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded border border-muted">
                Not scheduled to work
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
