
import React from "react";
import { TimesheetEntry, duplicateTimesheetEntry } from "@/lib/timesheet-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clock, FileText, Copy, User, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getEntryColor, getEntryDisplayName, formatUserName } from "./EntryCard";

interface MobileEntryCardProps {
  entry: TimesheetEntry;
  onEditEntry: (entry: TimesheetEntry) => void;
  onDeleteEntry: (entry: TimesheetEntry) => void;
  onEntryChange: () => void;
}

const MobileEntryCard: React.FC<MobileEntryCardProps> = ({
  entry,
  onEditEntry,
  onDeleteEntry,
  onEntryChange
}) => {
  const [isDuplicating, setIsDuplicating] = React.useState(false);
  
  const handleDuplicateEntry = async (entry: TimesheetEntry) => {
    if (!entry.id) return;
    
    try {
      setIsDuplicating(true);
      await duplicateTimesheetEntry(entry.id);
      
      toast({
        title: "Entry duplicated",
        description: "Time entry has been duplicated successfully.",
      });
      
      onEntryChange();
    } catch (error) {
      console.error("Error duplicating entry:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate time entry.",
        variant: "destructive",
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-md border rounded-xl",
        getEntryColor(entry)
      )}
    >
      <CardContent className="p-4">
        {/* Header with Project Name and Hours */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight break-words">
              {getEntryDisplayName(entry)}
            </h3>
            {entry.entry_type === 'contract' && (
              <div className="flex items-center mt-1">
                <Tag className="h-3 w-3 mr-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Contract</span>
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <div className="font-bold text-lg rounded-lg bg-background/70 px-3 py-1 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {entry.hours_logged}h
            </div>
          </div>
        </div>

        {/* User and Task Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{formatUserName(entry.user)}</span>
          </div>
          
          {entry.jira_task_id && (
            <div className="inline-block bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
              {entry.jira_task_id}
            </div>
          )}
          
          {entry.start_time && entry.end_time && (
            <div className="flex items-center bg-background/30 p-2 rounded-md text-sm">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                {entry.start_time} - {entry.end_time}
              </span>
            </div>
          )}
        </div>
        
        {/* Notes */}
        {entry.notes && (
          <div className="mb-3">
            <div className="flex items-start bg-background/40 p-3 rounded-lg">
              <FileText className="h-4 w-4 mt-0.5 text-muted-foreground mr-2 flex-shrink-0" />
              <p className="text-sm text-muted-foreground break-words leading-relaxed">
                {entry.notes}
              </p>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-background/30">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-4 hover:bg-amber-50 hover:text-amber-600 transition-colors hover:scale-105"
            onClick={() => handleDuplicateEntry(entry)}
            disabled={isDuplicating}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-4 hover:bg-green-50 hover:text-green-600 transition-colors hover:scale-105"
            onClick={() => onEditEntry(entry)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-4 hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={() => onDeleteEntry(entry)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileEntryCard;
