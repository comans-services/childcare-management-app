
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
import { Calendar, AlertTriangle, Lock } from "lucide-react";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useWorkingDaysValidation } from "@/hooks/useWorkingDaysValidation";
import { useAuth } from "@/context/AuthContext";
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
  const { userRole } = useAuth();

  // Get working days validation
  const weekStart = getWeekStart(date);
  const validation = useWorkingDaysValidation(userId, entries, weekStart);

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
  
  // Weekend-specific logic
  const isWeekendDate = isWeekend(date);
  const isAdmin = userRole === 'admin';
  const isPendingWeekendEntry = existingEntry?.approval_status === 'pending' && existingEntry?.requires_approval;

  const handleSubmit = async (values: TimeEntryFormValues) => {
    // Check validation for new entries
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
      
      // Show appropriate success message based on weekend status
      if (isWeekendDate && !isAdmin && !existingEntry) {
        toast({
          title: "Weekend entry submitted",
          description: "Your weekend entry has been submitted and is pending approval.",
        });
      } else {
        toast({
          title: existingEntry ? "Entry updated" : "Entry created",
          description: existingEntry 
            ? "Your timesheet entry has been updated." 
            : "Your timesheet entry has been created.",
        });
      }
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {existingEntry ? "Edit time entry" : "Add time"}
            {isWeekendDate && !isAdmin && <Lock className="h-4 w-4 text-amber-600" />}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 mt-4">
            <div className="flex items-center mb-4">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">{format(date, "EEE, MMM d, yyyy")}</span>
            </div>

            {/* Weekend Warning for Non-Admins */}
            {isWeekendDate && !isAdmin && (
              <Alert className="mb-4 border-amber-200 bg-amber-50">
                <Lock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Weekend Entry:</strong> This entry will require admin approval before being counted in your timesheet.
                </AlertDescription>
              </Alert>
            )}

            {/* Show pending status for existing weekend entries */}
            {isPendingWeekendEntry && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This weekend entry is currently pending approval.
                </AlertDescription>
              </Alert>
            )}

            {/* Working Days Validation Alert */}
            {showValidationWarning && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {validation.getValidationMessage()}
                </AlertDescription>
              </Alert>
            )}

            {/* Show validation info for allowed entries */}
            {!showValidationWarning && validation.daysRemaining > 0 && isNewEntry && (
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
                disabled={showValidationWarning}
              >
                {isWeekendDate && !isAdmin && !existingEntry ? "Submit for Approval" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TimeEntryDialog;
