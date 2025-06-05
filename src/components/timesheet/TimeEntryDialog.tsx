
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TimesheetEntry, Project, saveTimesheetEntry } from "@/lib/timesheet-service";
import { formatDate, getWeekStart } from "@/lib/date-utils";
import { toast } from "@/hooks/use-toast";
import { Calendar, AlertTriangle, Lock, Shield } from "lucide-react";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useWorkingDaysValidation } from "@/hooks/useWorkingDaysValidation";
import { useWeekendLock } from "@/hooks/useWeekendLock";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import the components we've created
import { timeEntryFormSchema, TimeEntryFormValues } from "./time-entry/schema";
import { EntryTypeSelector } from "./time-entry/EntryTypeSelector";
import { ProjectSelector } from "./time-entry/ProjectSelector";
import { ContractSelector } from "./time-entry/ContractSelector";
import { TimeInput } from "./time-entry/TimeInput";
import { TaskDetails } from "./time-entry/TaskDetails";

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  date: Date;
  projects: Project[];
  existingEntry?: TimesheetEntry;
  onSave: (entry?: TimesheetEntry) => void;
  entries: TimesheetEntry[]; // Add entries prop for validation
}

const TimeEntryDialog: React.FC<TimeEntryDialogProps> = ({
  open,
  onOpenChange,
  userId,
  date,
  projects,
  existingEntry,
  onSave,
  entries = [], // Default to empty array
}) => {
  const [entryType, setEntryType] = useState<"project" | "contract">("project");

  // Get working days validation
  const weekStart = getWeekStart(date);
  const validation = useWorkingDaysValidation(userId, entries, weekStart);

  // Get weekend lock status - now includes per-user permission checking
  const { isWeekendLocked, getWeekendMessage } = useWeekendLock(userId);

  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      entry_type: existingEntry?.entry_type || "project",
      project_id: existingEntry?.entry_type === "project" ? existingEntry.project_id : "",
      contract_id: existingEntry?.entry_type === "contract" ? existingEntry.contract_id : "",
      hours_logged: existingEntry?.hours_logged || 1,
      notes: existingEntry?.notes || "",
      jira_task_id: existingEntry?.jira_task_id || "",
      start_time: existingEntry?.start_time || "",
      end_time: existingEntry?.end_time || "",
    },
  });

  // Watch entry type changes
  const watchedEntryType = form.watch("entry_type");

  useEffect(() => {
    setEntryType(watchedEntryType || "project");
  }, [watchedEntryType]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        entry_type: existingEntry?.entry_type || "project",
        project_id: existingEntry?.entry_type === "project" ? existingEntry.project_id : "",
        contract_id: existingEntry?.entry_type === "contract" ? existingEntry.contract_id : "",
        hours_logged: existingEntry?.hours_logged || 1,
        notes: existingEntry?.notes || "",
        jira_task_id: existingEntry?.jira_task_id || "",
        start_time: existingEntry?.start_time || "",
        end_time: existingEntry?.end_time || "",
      });
    }
  }, [open, existingEntry, form]);

  // Check if this date can accept new entries
  const canAddToThisDate = validation.canAddToDate(date);
  const isWeekendBlocked = isWeekendLocked(date);
  const isNewEntry = !existingEntry;
  
  // Show validation warning for ANY entry that is blocked (both new and existing)
  const showWorkingDaysWarning = isNewEntry && !canAddToThisDate;
  const showWeekendWarning = isWeekendBlocked; // Remove isNewEntry condition - block all weekend operations

  const handleSubmit = async (values: TimeEntryFormValues) => {
    // Check weekend validation for ALL entries (both new and existing)
    if (isWeekendBlocked) {
      toast({
        title: "Weekend Entry Blocked",
        description: getWeekendMessage(date),
        variant: "destructive",
      });
      return;
    }

    // Check working days validation for new entries
    if (isNewEntry && !canAddToThisDate) {
      toast({
        title: "Cannot add entry",
        description: validation.getValidationMessage(),
        variant: "destructive",
      });
      return;
    }

    try {
      // Create unified entry data
      const entryData: TimesheetEntry = {
        id: existingEntry?.id,
        entry_type: values.entry_type,
        project_id: values.entry_type === 'project' ? values.project_id : undefined,
        contract_id: values.entry_type === 'contract' ? values.contract_id : undefined,
        entry_date: formatDate(date),
        hours_logged: values.hours_logged,
        notes: values.notes || "",
        jira_task_id: values.jira_task_id || "",
        start_time: values.start_time || undefined,
        end_time: values.end_time || undefined,
      };

      // Preserve related data from existing entry if available
      if (existingEntry) {
        if (existingEntry.project) {
          entryData.project = existingEntry.project;
        }
        if (existingEntry.contract) {
          entryData.contract = existingEntry.contract;
        }
        if (existingEntry.user) {
          entryData.user = existingEntry.user;
        }
      }
      
      const savedEntry = await saveTimesheetEntry(entryData);
      
      toast({
        title: existingEntry ? "Entry updated" : "Entry created",
        description: existingEntry 
          ? "Your timesheet entry has been updated." 
          : "Your timesheet entry has been created.",
      });
      
      onSave(savedEntry);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving entry:", error);
      
      // Check if it's a weekend validation error
      if (error instanceof Error && error.message.includes("Weekend time entries require admin approval")) {
        toast({
          title: "Weekend Entry Blocked",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save your entry.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const isFormDisabled = showWorkingDaysWarning || showWeekendWarning;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">{existingEntry ? "Edit time entry" : "Add time"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 mt-4">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">{format(date, "EEE, MMM d, yyyy")}</span>
            </div>

            {/* Weekend Approval Alert - now shows for ALL weekend operations */}
            {showWeekendWarning && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <Lock className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {getWeekendMessage(date)}
                </AlertDescription>
              </Alert>
            )}

            {/* Working Days Validation Alert */}
            {showWorkingDaysWarning && !showWeekendWarning && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {validation.getValidationMessage()}
                </AlertDescription>
              </Alert>
            )}

            {/* Show validation info for allowed entries */}
            {!isFormDisabled && validation.daysRemaining > 0 && isNewEntry && (
              <Alert className="mb-4">
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  {validation.getValidationMessage()}
                </AlertDescription>
              </Alert>
            )}
            
            <EntryTypeSelector control={form.control} />
            
            {entryType === "project" ? (
              <ProjectSelector control={form.control} projects={projects} />
            ) : (
              <ContractSelector control={form.control} />
            )}
            
            <TimeInput control={form.control} />

            <TaskDetails control={form.control} />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="px-6"
                disabled={isFormDisabled}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TimeEntryDialog;
