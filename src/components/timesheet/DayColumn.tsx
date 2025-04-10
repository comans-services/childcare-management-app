
import React, { useState } from "react";
import { formatDateShort, isToday, formatDate } from "@/lib/date-utils";
import { TimesheetEntry, Project, deleteTimesheetEntry } from "@/lib/timesheet-service";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import EntryForm from "./EntryForm";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface DayColumnProps {
  date: Date;
  userId: string;
  entries: TimesheetEntry[];
  projects: Project[];
  onEntryChange: () => void;
}

const DayColumn: React.FC<DayColumnProps> = ({
  date,
  userId,
  entries,
  projects,
  onEntryChange,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | undefined>(undefined);
  const [localEntries, setLocalEntries] = useState<TimesheetEntry[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TimesheetEntry | null>(null);
  
  // Format date consistently for comparison
  const formattedColumnDate = formatDate(date);
  console.log(`DayColumn for date ${formattedColumnDate}, original: ${date.toISOString()}`);
  
  // Filter entries for this day, using consistent date comparison
  const dayEntries = [...entries, ...localEntries].filter(entry => {
    // Debug the date comparison
    if (typeof entry.entry_date === 'string') {
      const entryDate = entry.entry_date.substring(0, 10); // Get just the YYYY-MM-DD part
      const matches = entryDate === formattedColumnDate;
      console.log(`Comparing entry date ${entryDate} with column date ${formattedColumnDate}: ${matches}`);
      return matches;
    }
    return false;
  });

  const totalHours = dayEntries.reduce(
    (sum, entry) => sum + entry.hours_logged,
    0
  );

  const handleEditEntry = (entry: TimesheetEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDeleteClick = (entry: TimesheetEntry) => {
    setEntryToDelete(entry);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete || !entryToDelete.id) return;
    
    try {
      await deleteTimesheetEntry(entryToDelete.id);
      toast({
        title: "Entry deleted",
        description: "Time entry deleted successfully.",
      });
      
      // Remove from local entries if it exists there
      setLocalEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
      onEntryChange();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete time entry.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(undefined);
    setShowForm(true);
  };

  const handleSaveComplete = (savedEntry?: TimesheetEntry) => {
    setShowForm(false);
    setEditingEntry(undefined);
    
    // Add the newly saved entry to local entries for immediate display
    if (savedEntry) {
      console.log(`Saved entry date: ${savedEntry.entry_date}, column date: ${formattedColumnDate}`);
      
      // Ensure we have consistent date format for the entry
      // This specifically handles the case where the entry date might be in a different format
      if (savedEntry.entry_date !== formattedColumnDate) {
        // Try to normalize dates for comparison
        const savedEntryDate = typeof savedEntry.entry_date === 'string' 
          ? savedEntry.entry_date.substring(0, 10) 
          : savedEntry.entry_date;
          
        if (savedEntryDate === formattedColumnDate) {
          console.log("Date formats match after normalization, updating entry");
          savedEntry.entry_date = formattedColumnDate;
        } else {
          console.log("Date formats don't match even after normalization");
          // Check if the dates represent the same day
          const entryDateObj = new Date(savedEntry.entry_date);
          const columnDateObj = new Date(formattedColumnDate);
          
          if (
            entryDateObj.getFullYear() === columnDateObj.getFullYear() &&
            entryDateObj.getMonth() === columnDateObj.getMonth() &&
            entryDateObj.getDate() === columnDateObj.getDate()
          ) {
            console.log("Same calendar day detected, updating entry date format");
            savedEntry.entry_date = formattedColumnDate;
          }
        }
      }
      
      setLocalEntries(prev => {
        // Replace if exists, otherwise add
        const exists = prev.some(e => e.id === savedEntry.id);
        if (exists) {
          return prev.map(e => e.id === savedEntry.id ? savedEntry : e);
        }
        return [...prev, savedEntry];
      });
    }
    
    onEntryChange();
  };

  return (
    <div className="flex flex-col h-full min-w-0 max-w-full">
      <div className={cn(
        "text-xs md:text-sm font-medium p-1 md:p-2 rounded-t-md",
        isToday(date) ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {formatDateShort(date)}
        {isToday(date) && <span className="ml-1">(Today)</span>}
      </div>

      <div className="h-full overflow-hidden">
        {showForm ? (
          <Card className="h-full">
            <CardContent className="pt-4 p-2 md:p-4">
              <EntryForm
                userId={userId}
                date={date}
                projects={projects}
                existingEntry={editingEntry}
                onSave={handleSaveComplete}
                onCancel={() => setShowForm(false)}
              />
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[50vh] md:h-[60vh]">
            <div className="flex flex-col p-1 space-y-2">
              <div className="text-center py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>

              {dayEntries.map((entry) => (
                <Card key={entry.id || `temp-${Date.now()}-${Math.random()}`} className="overflow-hidden">
                  <CardContent className="p-2 md:p-3">
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-xs md:text-sm truncate max-w-[70%]">
                        {entry.project?.name || "Unknown Project"}
                      </div>
                      <div className="text-xs md:text-sm font-medium">
                        {entry.hours_logged} hr{entry.hours_logged !== 1 ? "s" : ""}
                      </div>
                    </div>
                    
                    {entry.jira_task_id && (
                      <div className="text-[10px] md:text-xs text-muted-foreground mt-1 truncate">
                        JIRA: {entry.jira_task_id}
                      </div>
                    )}
                    
                    {entry.notes && (
                      <div className="text-[10px] md:text-xs mt-1 text-muted-foreground line-clamp-2 break-words">
                        {entry.notes}
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-1 space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEditEntry(entry)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDeleteClick(entry)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {dayEntries.length > 0 && (
                <div className="text-xs font-medium text-right pr-2">
                  Total: {totalHours} hr{totalHours !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
      
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DayColumn;
