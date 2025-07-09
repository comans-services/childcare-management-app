import React, { useState } from "react";
import { formatDate, getWeekStart } from "@/lib/date-utils";
import { TimesheetEntry, Project, deleteTimesheetEntry } from "@/lib/timesheet-service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useWorkingDaysValidation } from "@/hooks/useWorkingDaysValidation";
import { useWeekendLock } from "@/hooks/useWeekendLock";
import { isWeekend } from "@/lib/date-utils";
import { sortEntriesByTime } from "@/lib/time-sorting-utils";
import DayHeader from "./DayHeader";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import MobileEntryCard from "../entry-card/MobileEntryCard";

interface MobileDayColumnProps {
  date: Date;
  userId: string;
  entries: TimesheetEntry[];
  projects: Project[];
  onEntryChange: () => void;
  onAddEntry: () => void;
  onEditEntry: (entry: TimesheetEntry) => void;
}

const MobileDayColumn: React.FC<MobileDayColumnProps> = ({
  date,
  userId,
  entries,
  projects,
  onEntryChange,
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

  // Get weekend lock validation
  const { validateWeekendEntry } = useWeekendLock(userId);

  const formattedColumnDate = formatDate(date);

  // Filter entries for this day and sort by time
  const dayEntries = sortEntriesByTime(
    entries.filter(entry => {
      if (typeof entry.entry_date === 'string') {
        const entryDate = entry.entry_date.substring(0, 10);
        return entryDate === formattedColumnDate;
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

  // Check if this day can accept new entries
  const canAddToThisDay = validation.canAddToDate(date);
  const hasEntries = dayEntries.length > 0;
  
  // Weekend-specific validation
  const isWeekendDay = isWeekend(date);
  const weekendValidation = validateWeekendEntry(date);
  const isWeekendBlocked = isWeekendDay && !weekendValidation.isValid;

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

  const handleAddEntry = () => {
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

    onAddEntry();
  };

  const isDayBlocked = (!canAddToThisDay && !hasEntries) || (isWeekendBlocked && !hasEntries);

  return (
    <Card className={cn(
      "h-full shadow-sm transition-all duration-200",
      isDayBlocked && "bg-gray-50 border-dashed opacity-75",
      isWeekendBlocked && !hasEntries && "bg-red-50 border-red-200 border-dashed",
      isWeekendDay && !isWeekendBlocked && "bg-blue-50"
    )}>
      <CardContent className="p-0">
        <DayHeader date={date} />
        
        {/* Progress Bar */}
        {totalHours > 0 && (
          <div className="px-3 pb-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${dayProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              {totalHours.toFixed(1)}h / {dailyTarget}h
            </p>
          </div>
        )}

        {/* Add Entry Button */}
        <div className="px-3 pb-3">
          <Button
            onClick={handleAddEntry}
            disabled={isDayBlocked}
            variant="outline"
            size="lg"
            className={cn(
              "w-full h-12 border-dashed hover:border-solid transition-all duration-200",
              isDayBlocked && "opacity-50 cursor-not-allowed",
              !isDayBlocked && "hover:bg-primary/5 hover:border-primary"
            )}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Time
          </Button>
        </div>

        {/* Status Messages */}
        {!canAddToThisDay && !hasEntries && (
          <div className="px-3 pb-3">
            <div className="text-xs text-center p-2 bg-amber-50 rounded border border-amber-200 text-amber-800">
              Day limit reached
            </div>
          </div>
        )}

        {isWeekendBlocked && !hasEntries && (
          <div className="px-3 pb-3">
            <div className="text-xs text-center p-2 bg-red-50 rounded border border-red-200 text-red-800">
              Weekend entries disabled
            </div>
          </div>
        )}

        {isWeekendDay && !isWeekendBlocked && !hasEntries && (
          <div className="px-3 pb-3">
            <div className="text-xs text-center p-2 bg-blue-50 rounded border border-blue-200 text-blue-800">
              Weekend day
            </div>
          </div>
        )}

        {/* Entries - now sorted by time */}
        <ScrollArea className="max-h-[60vh]">
          <div className="px-3 pb-3 space-y-3">
            {dayEntries.map((entry) => (
              <MobileEntryCard
                key={entry.id}
                entry={entry}
                onEditEntry={onEditEntry}
                onDeleteEntry={handleDeleteClick}
                onEntryChange={onEntryChange}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </Card>
  );
};

export default MobileDayColumn;
