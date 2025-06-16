
import React from "react";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit2, Copy, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { duplicateTimesheetEntry } from "@/lib/timesheet-service";
import { toast } from "@/hooks/use-toast";

interface EntryCardProps {
  entry: TimesheetEntry;
  project?: Project;
  canPerformOperations: boolean;
  onEdit: (entry: TimesheetEntry) => void;
  onDelete: (entry: TimesheetEntry) => void;
}

const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  project,
  canPerformOperations,
  onEdit,
  onDelete,
}) => {
  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await duplicateTimesheetEntry(entry.id!);
      toast({
        title: "Entry duplicated",
        description: "The timesheet entry has been duplicated successfully.",
      });
      
      // Trigger a page refresh to show the new entry
      window.location.reload();
    } catch (error) {
      console.error("Error duplicating entry:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate the entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 truncate">
              {entry.entry_type === 'project' 
                ? (project?.name || "Unknown Project")
                : "Contract Work"
              }
            </span>
            <span className="text-sm font-semibold text-primary">
              {entry.hours_logged}h
            </span>
          </div>
          
          {entry.notes && (
            <p className="text-xs text-gray-600 truncate">
              {entry.notes}
            </p>
          )}
          
          {entry.jira_task_id && (
            <p className="text-xs text-blue-600 truncate">
              Task: {entry.jira_task_id}
            </p>
          )}
        </div>

        {/* Actions menu - only show if user can perform operations */}
        {canPerformOperations && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(entry);
                }}
                className="cursor-pointer"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDuplicate}
                className="cursor-pointer"
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry);
                }}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default EntryCard;
