
import React, { useState } from "react";
import { formatDateShort, isToday } from "@/lib/date-utils";
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

  const dayEntries = entries.filter(
    (entry) => entry.entry_date === date.toISOString().split("T")[0]
  );

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
      await deleteTimesheetEntry(entry.id, userId);
      toast({
        title: "Entry deleted",
        description: "Time entry deleted successfully.",
      });
      onEntryChange();
    } catch (error) {
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

  const handleSaveComplete = () => {
    setShowForm(false);
    setEditingEntry(undefined);
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
            {dayEntries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden">
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
