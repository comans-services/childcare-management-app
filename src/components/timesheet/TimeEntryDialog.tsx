
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
import { Calendar, AlertTriangle, AlertCircle } from "lucide-react";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useWorkingDaysValidation } from "@/hooks/useWorkingDaysValidation";
import { useWeekendLock } from "@/hooks/useWeekendLock";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import WeekendApprovalDialog from "./WeekendApprovalDialog";
import { validateProjectBudget } from "@/lib/timesheet/validation/budget-validation-service";

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

interface BudgetValidation {
  isValid: boolean;
  message?: string;
  remainingHours: number;
  totalBudget: number;
  hoursUsed: number;
  isOverBudget: boolean;
  canOverride: boolean;
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
  const [budgetValidation, setBudgetValidation] = useState<BudgetValidation | null>(null);
  const [budgetChecking, setBudgetChecking] = useState(false);

  // Get working days validation
  const weekStart = getWeekStart(date);
  const validation = useWorkingDaysValidation(userId, entries, weekStart);

  // Get weekend lock validation with admin override
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

  // Watch form values for real-time budget checking
  const watchedEntryType = form.watch("entry_type");
  const watchedProjectId = form.watch("project_id");
  const watchedHours = form.watch("hours_logged");

  useEffect(() => {
    setEntryType(watchedEntryType || "project");
  }, [watchedEntryType]);

  // Real-time budget validation
  useEffect(() => {
    const checkBudget = async () => {
      // Only check for project entries with valid data
      if (watchedEntryType !== "project" || !watchedProjectId || !watchedHours || watchedHours <= 0) {
        setBudgetValidation(null);
        return;
      }

      setBudgetChecking(true);
      try {
        console.log("=== REAL-TIME BUDGET CHECK ===");
        console.log("Project ID:", watchedProjectId);
        console.log("Hours:", watchedHours);
        console.log("Existing Entry ID:", existingEntry?.id);

        const validation = await validateProjectBudget({
          projectId: watchedProjectId,
          hoursToAdd: Number(watchedHours),
          existingEntryId: existingEntry?.id,
          userId
        });

        setBudgetValidation(validation);
        console.log("Budget validation result:", validation);
      } catch (error) {
        console.error("Error checking budget:", error);
        setBudgetValidation({
          isValid: false,
          message: "Failed to check project budget",
          remainingHours: 0,
          totalBudget: 0,
          hoursUsed: 0,
          isOverBudget: true,
          canOverride: false
        });
      } finally {
        setBudgetChecking(false);
      }
    };

    // Debounce the budget check to avoid too many API calls
    const timeoutId = setTimeout(checkBudget, 300);
    return () => clearTimeout(timeoutId);
  }, [watchedEntryType, watchedProjectId, watchedHours, existingEntry?.id, userId]);

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
      setBudgetValidation(null);
    }
  }, [open, existingEntry, form]);

  // Validation checks
  const isNewEntry = !existingEntry;
  const isWeekendDate = isWeekend(date);
  const isAdmin = userRole === "admin";
  
  // Working days validation
  const canAddToThisDate = validation.canAddToDate(date);
  const showWorkingDaysWarning = isNewEntry && !canAddToThisDate;

  // Weekend validation with admin override integration
  const weekendValidation = validateWeekendEntry(date);
  const canLogWeekend = weekendValidation.isValid;
  const showWeekendWarning = isWeekendDate && !canLogWeekend && isNewEntry;

  // Budget validation checks
  const showBudgetError = budgetValidation && !budgetValidation.isValid && !budgetValidation.canOverride;
  const showBudgetWarning = budgetValidation && budgetValidation.isValid && budgetValidation.message;
  const showBudgetOverride = budgetValidation && !budgetValidation.isValid && budgetValidation.canOverride;

  const handleSubmit = async (values: TimeEntryFormValues) => {
    // Priority validation order: working days first, then weekend, then budget
    if (isNewEntry && !canAddToThisDate) {
      toast({
        title: "Cannot add entry",
        description: validation.getValidationMessage(),
        variant: "destructive",
      });
      return;
    }

    // Weekend validation for new entries (with admin override already applied)
    if (isNewEntry && showWeekendWarning) {
      setWeekendApprovalOpen(true);
      return;
    }

    // Budget validation - block non-admin users from exceeding budget
    if (showBudgetError) {
      toast({
        title: "Budget exceeded",
        description: budgetValidation?.message || "This entry would exceed the project budget.",
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
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save your entry.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    setBudgetValidation(null);
    onOpenChange(false);
  };

  // Determine if the save button should be disabled
  const isSaveDisabled = showWorkingDaysWarning || showWeekendWarning || showBudgetError || budgetChecking;

  const getBudgetStatusColor = () => {
    if (!budgetValidation) return "";
    if (budgetValidation.isOverBudget) return "text-red-600";
    if (budgetValidation.usagePercentage >= 95) return "text-red-600";
    if (budgetValidation.usagePercentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

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

              {/* Working Days Validation Alert - Highest Priority */}
              {showWorkingDaysWarning && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {validation.getValidationMessage()}
                  </AlertDescription>
                </Alert>
              )}

              {/* Weekend Validation Alert - Only show if working days validation passes */}
              {!showWorkingDaysWarning && showWeekendWarning && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Weekend entries are not allowed. Please contact your administrator for approval.
                  </AlertDescription>
                </Alert>
              )}

              {/* Budget Error Alert - Show when budget would be exceeded */}
              {!showWorkingDaysWarning && !showWeekendWarning && showBudgetError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {budgetValidation?.message || "This entry would exceed the project budget."}
                  </AlertDescription>
                </Alert>
              )}

              {/* Budget Override Alert - Show when admin can override */}
              {!showWorkingDaysWarning && !showWeekendWarning && showBudgetOverride && (
                <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <div className="font-medium">Admin Override Active</div>
                    {budgetValidation?.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Budget Warning Alert - Show when approaching budget limit */}
              {!showWorkingDaysWarning && !showWeekendWarning && !showBudgetError && !showBudgetOverride && showBudgetWarning && (
                <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    {budgetValidation?.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Budget Status Display - Show current budget info when valid */}
              {!showWorkingDaysWarning && !showWeekendWarning && budgetValidation && budgetValidation.totalBudget > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Project Budget:</span>
                    <span className={`font-medium ${getBudgetStatusColor()}`}>
                      {budgetValidation.hoursUsed.toFixed(1)} / {budgetValidation.totalBudget.toFixed(1)} hours used
                      {budgetValidation.remainingHours > 0 && (
                        <span className="ml-2 text-gray-500">
                          ({budgetValidation.remainingHours.toFixed(1)}h remaining)
                        </span>
                      )}
                    </span>
                  </div>
                  {budgetChecking && (
                    <div className="mt-2 text-xs text-gray-500">Checking budget...</div>
                  )}
                </div>
              )}

              {/* Show validation info for allowed entries */}
              {!showWorkingDaysWarning && !showWeekendWarning && validation.daysRemaining > 0 && isNewEntry && (
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
                  {budgetChecking ? "Checking..." : "Save"}
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
