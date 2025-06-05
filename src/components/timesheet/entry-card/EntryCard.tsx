
import React from "react";
import { Draggable } from "react-beautiful-dnd";
import { Edit, Trash2, Copy } from "lucide-react";
import { TimesheetEntry, duplicateTimesheetEntry } from "@/lib/timesheet-service";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ApprovalStatusBadge from "../ApprovalStatusBadge";

interface EntryCardProps {
  entry: TimesheetEntry;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onEntryChange: () => void;
}

const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  index,
  onEdit,
  onDelete,
  onEntryChange,
}) => {
  const handleDuplicate = async () => {
    if (!entry.id) return;
    
    try {
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
    }
  };

  const getProjectOrContractName = () => {
    if (entry.entry_type === 'project' && entry.project) {
      return entry.project.name;
    }
    if (entry.entry_type === 'contract' && entry.contract) {
      return entry.contract.name;
    }
    return 'Unknown';
  };

  const isPending = entry.approval_status === 'pending';

  return (
    <Draggable draggableId={entry.id || ""} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "group border rounded-lg p-3 bg-background shadow-sm hover:shadow-md transition-all duration-200 cursor-move",
            snapshot.isDragging && "shadow-lg rotate-2 scale-105",
            isPending && "border-amber-200 bg-amber-50"
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate mb-1">
                {getProjectOrContractName()}
              </h4>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-lg font-bold",
                  isPending && "text-amber-700"
                )}>
                  {entry.hours_logged}h
                </span>
                <ApprovalStatusBadge entry={entry} />
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-7 w-7 p-0 hover:bg-blue-100"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDuplicate}
                className="h-7 w-7 p-0 hover:bg-green-100"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-7 w-7 p-0 hover:bg-red-100"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {entry.notes && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {entry.notes}
            </p>
          )}

          {entry.jira_task_id && (
            <p className="text-xs text-blue-600 mt-1 font-mono">
              {entry.jira_task_id}
            </p>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default EntryCard;
