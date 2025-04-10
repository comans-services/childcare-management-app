import React, { useState } from "react";
import { formatDateShort, isToday, formatDate } from "@/lib/date-utils";
import { TimesheetEntry, Project, deleteTimesheetEntry } from "@/lib/timesheet-service";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import EntryForm from "./EntryForm";
import { cn } from "@/lib/utils";

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

  const handleDeleteEntry = async (entry: TimesheetEntry) => {
    if (!entry.id) return;
    
    try {
      await deleteTimesheetEntry(entry.id);
      toast({
        title: "Entry deleted",
        description: "Time entry deleted successfully.",
      });
      
      // Remove from local entries if it exists there
      setLocalEntries(prev => prev.filter(e => e.id !== entry.id));
      onEntryChange();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete time entry.",
        variant: "destructive",
      });
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
    <div className="flex-1 min-w-[180px] max-w-[250px]">
      <div className={cn(
        "text-sm font-medium p-2 rounded-t-md mb-1",
        isToday(date) ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {formatDateShort(date)}
        {isToday(date) && <span className="ml-1">(Today)</span>}
      </div>

      <div className="space-y-2">
        {showForm ? (
          <Card>
            <CardContent className="pt-4">
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
          <>
            <div className="text-center py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleAddEntry}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Time
              </Button>
            </div>

            {dayEntries.map((entry) => (
              <Card key={entry.id || `temp-${Date.now()}-${Math.random()}`} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">
                      {entry.project?.name || "Unknown Project"}
                    </div>
                    <div className="text-sm font-medium">
                      {entry.hours_logged} hr{entry.hours_logged !== 1 ? "s" : ""}
                    </div>
                  </div>
                  
                  {entry.jira_task_id && (
                    <div className="text-xs text-muted-foreground mt-1">
                      JIRA: {entry.jira_task_id}
                    </div>
                  )}
                  
                  {entry.notes && (
                    <div className="text-sm mt-1 text-muted-foreground line-clamp-2">
                      {entry.notes}
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-2 space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditEntry(entry)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEntry(entry)}
                    >
                      <Trash2 className="h-4 w-4" />
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
          </>
        )}
      </div>
    </div>
  );
};

export default DayColumn;
