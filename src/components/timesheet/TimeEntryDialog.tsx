
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
import { formatDate, getWeekStart, isWeekend } from "@/lib/date-utils";
import { toast } from "@/hooks/use-toast";
import { Calendar, AlertTriangle } from "lucide-react";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useWorkingDaysValidation } from "@/hooks/useWorkingDaysValidation";
import { useWeekendLock } from "@/hooks/useWeekendLock";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import WeekendApprovalDialog from "./WeekendApprovalDialog";

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
  const { userRole } = useAuth();
  const [entryType, setEntryType] = useState<"project" | "contract">("project");
  const [weekendApprovalOpen, setWeekendApprovalOpen] = useState(false);

  // Get working days validation
  const weekStart = getWeekStart(date);
  const validation = useWorkingDaysValidation(userId, entries, weekStart);

  // Get weekend lock validation
  const { validateWeekendEntry } = useWeekendLock(userId);

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
  const isNewEntry = !existingEntry;
  const showValidationWarning = isNewEntry && !canAddToThisDate;

  // Weekend validation
  const isWeekendDate = isWeekend(date);
  const isAdmin = userRole === "admin";
  const weekendValidation = validateWeekendEntry(date);
  const canLogWeekend = weekendValidation.isValid;
  const showWeekendWarning = isWeekendDate && !canLogWeekend && isNewEntry;

  const handleSubmit = async (values: TimeEntryFormValues) => {
    // Check working days validation for new entries
    if (isNewEntry && !canAddToThisDate) {
      toast({
        title: "Cannot add entry",
        description: validation.getValidationMessage(),
        variant: "destructive",
      });
      return;
    }

    // Check weekend validation for new entries
    if (isNewEntry && showWeekendWarning) {
      setWeekendApprovalOpen(true);
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
      toast({
        title: "Error",
        description: "Failed to save your entry.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  // Determine if the save button should be disabled
  const isSaveDisabled = showValidationWarning || showWeekendWarning;

  return (
    <>
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
                {isWeekendDate && (
                  <div className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    Weekend
                  </div>
                )}
              </div>

              {/* Working Days Validation Alert */}
              {showValidationWarning && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {validation.getValidationMessage()}
                  </AlertDescription>
                </Alert>
              )}

              {/* Weekend Validation Alert */}
              {showWeekendWarning && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Weekend entries are not allowed. Please contact your administrator for approval.
                  </AlertDescription>
                </Alert>
              )}

              {/* Show validation info for allowed entries */}
              {!showValidationWarning && !showWeekendWarning && validation.daysRemaining > 0 && isNewEntry && (
                <Alert className="mb-4">
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    {validation.getValidationMessage()}
                  </AlertDescription>
                </Alert>
              )}

              {/* Show weekend allowed info for admins */}
              {isWeekendDate && canLogWeekend && isAdmin && (
                <Alert className="mb-4">
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    Weekend entry allowed (Admin privilege).
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
                  disabled={isSaveDisabled}
                >
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <WeekendApprovalDialog
        open={weekendApprovalOpen}
        onOpenChange={setWeekendApprovalOpen}
        date={date}
      />
    </>
  );
};

export default TimeEntryDialog;
