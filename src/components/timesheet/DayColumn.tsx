import React, { useState } from "react";
import { formatDateShort, isToday, formatDate } from "@/lib/date-utils";
import { TimesheetEntry, Project, deleteTimesheetEntry } from "@/lib/timesheet-service";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Clock, FileText, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import EntryForm from "./EntryForm";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DayColumnProps {
  date: Date;
  userId: string;
  entries: TimesheetEntry[];
  projects: Project[];
  onEntryChange: () => void;
  droppableId: string;
}

const PROJECT_COLORS: { [key: string]: string } = {
  default: "bg-gray-100 border-gray-200 hover:bg-gray-50",
  development: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  design: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  marketing: "bg-green-50 border-green-200 hover:bg-green-100",
  management: "bg-amber-50 border-amber-200 hover:bg-amber-100",
  support: "bg-rose-50 border-rose-200 hover:bg-rose-100",
};

const DayColumn: React.FC<DayColumnProps> = ({
  date,
  userId,
  entries,
  projects,
  onEntryChange,
  droppableId,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | undefined>(undefined);
  const [localEntries, setLocalEntries] = useState<TimesheetEntry[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TimesheetEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dailyTarget = 8;

  const formattedColumnDate = formatDate(date);

  const dayEntries = [...entries, ...localEntries].filter(entry => {
    if (typeof entry.entry_date === 'string') {
      const entryDate = entry.entry_date.substring(0, 10);
      const matches = entryDate === formattedColumnDate;
      return matches;
    }
    return false;
  });

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

  const getProjectColor = (project?: Project) => {
    if (!project) return PROJECT_COLORS.default;
    
    const name = project.name.toLowerCase();
    
    if (name.includes("dev") || name.includes("code")) {
      return PROJECT_COLORS.development;
    } else if (name.includes("design") || name.includes("ui") || name.includes("ux")) {
      return PROJECT_COLORS.design;
    } else if (name.includes("market") || name.includes("sales")) {
      return PROJECT_COLORS.marketing;
    } else if (name.includes("manage") || name.includes("lead") || name.includes("admin")) {
      return PROJECT_COLORS.management;
    } else if (name.includes("support") || name.includes("help") || name.includes("service")) {
      return PROJECT_COLORS.support;
    }
    
    return PROJECT_COLORS.default;
  };

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
      setIsDeleting(true);
      await deleteTimesheetEntry(entryToDelete.id);
      toast({
        title: "Entry deleted",
        description: "Time entry deleted successfully.",
      });
      
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
      setIsDeleting(false);
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
    
    if (savedEntry) {
      console.log(`Saved entry date: ${savedEntry.entry_date}, column date: ${formattedColumnDate}`);
      
      if (savedEntry.entry_date !== formattedColumnDate) {
        const savedEntryDate = typeof savedEntry.entry_date === 'string' 
          ? savedEntry.entry_date.substring(0, 10) 
          : savedEntry.entry_date;
          
        if (savedEntryDate === formattedColumnDate) {
          console.log("Date formats match after normalization, updating entry");
          savedEntry.entry_date = formattedColumnDate;
        } else {
          console.log("Date formats don't match even after normalization");
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
    <div className="flex flex-col h-full min-w-0 w-full max-w-full">
      <div className={cn(
        "text-xs md:text-sm font-medium p-2 md:p-3 rounded-t-md relative overflow-hidden",
        isToday(date) 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
        <div className="flex justify-between items-center">
          <span className="font-bold">{formatDateShort(date)}</span>
          {isToday(date) && (
            <span className="px-1.5 py-0.5 bg-white/20 text-white rounded-full text-[10px]">Today</span>
          )}
        </div>
        
        {totalHours > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1">
            <div 
              className={cn("h-full", getProgressColor())} 
              style={{ width: `${dayProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      <div className="h-full flex-grow overflow-hidden bg-background border border-t-0 rounded-b-md shadow-sm">
        {showForm ? (
          <Card className="h-full border-0 shadow-none">
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
            <div className="flex flex-col p-2 space-y-2 min-w-0">
              <div className="text-center py-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                        onClick={handleAddEntry}
                        aria-label="Add new time entry"
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add Entry
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add a new time entry for this day</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Droppable droppableId={droppableId}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps}
                    className={cn(
                      "flex flex-col space-y-2 min-h-[50px] p-1 transition-colors rounded-md",
                      snapshot.isDraggingOver ? "bg-primary/5" : ""
                    )}
                  >
                    {dayEntries.length === 0 ? (
                      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                        No entries for this day
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {dayEntries.map((entry, index) => (
                          <Draggable 
                            key={entry.id || `temp-${Date.now()}-${Math.random()}`} 
                            draggableId={entry.id || `temp-${Date.now()}-${Math.random()}`} 
                            index={index}
                            isDragDisabled={!entry.id}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  "transition-all duration-300 hover:shadow-md animate-in fade-in-50",
                                  snapshot.isDragging ? "opacity-80 scale-[1.02] shadow-lg z-10" : ""
                                )}
                              >
                                <Card 
                                  className={cn(
                                    "overflow-hidden transition-all duration-200 hover:-translate-y-0.5 border rounded-xl",
                                    getProjectColor(entry.project)
                                  )}
                                >
                                  <CardContent className="p-3 md:p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div 
                                              {...provided.dragHandleProps} 
                                              className="cursor-grab opacity-70 hover:opacity-100 transition-opacity"
                                            >
                                              <GripVertical className="h-3 w-3 flex-shrink-0" aria-label="Drag to reorder" />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Drag to reorder this entry</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <h3 className="font-semibold text-xs md:text-sm break-words whitespace-normal w-full">
                                        {entry.project?.name || "Unknown Project"}
                                      </h3>
                                    </div>

                                    <div className="flex justify-between items-center mb-2">
                                      <div className="text-xs md:text-sm font-bold rounded-full bg-background/50 px-2 py-0.5 flex items-center flex-shrink-0">
                                        <Clock className="h-3 w-3 mr-1 inline flex-shrink-0" aria-hidden="true" />
                                        {entry.hours_logged} hr{entry.hours_logged !== 1 ? "s" : ""}
                                      </div>
                                      
                                      {entry.jira_task_id && (
                                        <div className="text-[10px] md:text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 inline-block truncate max-w-[120px]">
                                          {entry.jira_task_id}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {entry.notes && (
                                      <div className="flex items-start mt-2 bg-background/30 p-1.5 rounded-md">
                                        <FileText className="h-3 w-3 mt-0.5 text-muted-foreground mr-1.5 flex-shrink-0" aria-hidden="true" />
                                        <p className="text-[10px] md:text-xs text-muted-foreground break-words whitespace-normal w-full">
                                          {entry.notes}
                                        </p>
                                      </div>
                                    )}
                                    
                                    <div className="flex justify-end mt-3 space-x-1 pt-1 border-t border-t-background/20">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 hover:bg-green-50 hover:text-green-600 transition-colors flex-shrink-0 hover:border-green-100 hover:scale-110"
                                              onClick={() => handleEditEntry(entry)}
                                              aria-label="Edit entry"
                                            >
                                              <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Edit this entry</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
                                              onClick={() => handleDeleteClick(entry)}
                                              aria-label="Delete entry"
                                              disabled={isDeleting}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Delete this entry</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {dayEntries.length > 0 && (
                <div className="flex justify-between items-center py-1 px-2 text-xs font-medium">
                  <span>Total:</span>
                  <span className="font-bold">{totalHours} hr{totalHours !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
      
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-xl border-red-200 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:scale-105 transition-transform duration-200">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105 transition-all duration-200"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DayColumn;
