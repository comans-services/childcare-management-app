
import React, { useEffect, useState, useCallback } from "react";
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
import { showBudgetToast, showBudgetSaveSuccess } from "@/lib/timesheet/budget-notification-service";

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
  usagePercentage: number;
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
  const [isValidating, setIsValidating] = useState(false);

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

  // Immediate budget validation without debouncing for critical decisions
  const checkBudget = useCallback(async () => {
    // Only check for project entries with valid data
    if (watchedEntryType !== "project" || !watchedProjectId || !watchedHours || watchedHours <= 0) {
      setBudgetValidation(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    setBudgetChecking(true);
    
    try {
      console.log("=== IMMEDIATE BUDGET CHECK FOR SAVE VALIDATION ===");
      console.log("Project ID:", watchedProjectId);
      console.log("Hours:", watchedHours);
      console.log("Existing Entry ID:", existingEntry?.id);
      console.log("User Role:", userRole);

      const validation = await validateProjectBudget({
        projectId: watchedProjectId,
        hoursToAdd: Number(watchedHours),
        existingEntryId: existingEntry?.id,
        userId
      });

      setBudgetValidation(validation);
      console.log("Budget validation result:", validation);
      console.log("Can save:", validation.isValid || validation.canOverride);
    } catch (error) {
      console.error("Error checking budget:", error);
      setBudgetValidation({
        isValid: false,
        message: "Failed to check project budget",
        remainingHours: 0,
        totalBudget: 0,
        hoursUsed: 0,
        isOverBudget: true,
        canOverride: false,
        usagePercentage: 0
      });
    } finally {
      setBudgetChecking(false);
      setIsValidating(false);
    }
  }, [watchedEntryType, watchedProjectId, watchedHours, existingEntry?.id, userId, userRole]);

  // Immediate validation for save button state (no debounce)
  useEffect(() => {
    checkBudget();
  }, [checkBudget]);

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
      setIsValidating(false);
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

  // Budget validation checks with stronger employee blocking
  const showBudgetError = budgetValidation && !budgetValidation.isValid && !budgetValidation.canOverride;
  const showBudgetWarning = budgetValidation && budgetValidation.isValid && budgetValidation.message;
  const showBudgetOverride = budgetValidation && !budgetValidation.isValid && budgetValidation.canOverride;

  // Employee-specific budget blocking
  const isEmployeeBudgetBlocked = budgetValidation && !budgetValidation.isValid && !isAdmin;

  const handleSubmit = async (values: TimeEntryFormValues) => {
    console.log("=== ATTEMPTING TO SAVE ENTRY ===");
    console.log("User Role:", userRole);
    console.log("Budget Validation:", budgetValidation);
    console.log("Is Employee Budget Blocked:", isEmployeeBudgetBlocked);

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

    // Critical: Block employees from exceeding budget
    if (isEmployeeBudgetBlocked) {
      console.error("BLOCKING EMPLOYEE SAVE - Budget exceeded and user cannot override");
      const selectedProject = projects.find(p => p.id === values.project_id);
      toast({
        title: "Budget Exceeded",
        description: `Cannot save entry${selectedProject ? ` for ${selectedProject.name}` : ""}. ${budgetValidation?.message || "This entry would exceed the project budget."}`,
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
      
      console.log("Attempting to save entry:", entryData);
      const savedEntry = await saveTimesheetEntry(entryData);
      console.log("Entry saved successfully:", savedEntry);
      
      // Show success notification with budget info
      const selectedProject = projects.find(p => p.id === values.project_id);
      showBudgetSaveSuccess(!!existingEntry, budgetValidation || undefined, selectedProject?.name);
      
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
    setIsValidating(false);
    onOpenChange(false);
  };

  // Determine if the save button should be disabled - strengthen employee blocking
  const isSaveDisabled = showWorkingDaysWarning || 
                        showWeekendWarning || 
                        isEmployeeBudgetBlocked || 
                        isValidating || 
                        budgetChecking;

  const getBudgetStatusColor = () => {
    if (!budgetValidation) return "";
    if (budgetValidation.isOverBudget) return "text-red-600";
    if (budgetValidation.usagePercentage >= 95) return "text-red-600";
    if (budgetValidation.usagePercentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const getSaveButtonText = () => {
    if (isValidating || budgetChecking) return "Checking Budget...";
    if (isEmployeeBudgetBlocked) return "Budget Exceeded";
    return "Save";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[90vh]">
          {/* Fixed Header */}
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle className="text-xl">{existingEntry ? "Edit time entry" : "Add time"}</DialogTitle>
          </DialogHeader>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2">
            <div className="space-y-4">
              <div className="flex items-center">
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
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {validation.getValidationMessage()}
                  </AlertDescription>
                </Alert>
              )}

              {/* Weekend Validation Alert - Only show if working days validation passes */}
              {!showWorkingDaysWarning && showWeekendWarning && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Weekend entries are not allowed. Please contact your administrator for approval.
                  </AlertDescription>
                </Alert>
              )}

              {/* Enhanced Budget Error Alert for Employees - Show when budget would be exceeded */}
              {!showWorkingDaysWarning && !showWeekendWarning && isEmployeeBudgetBlocked && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">Budget Exceeded - Entry Blocked</div>
                    {budgetValidation?.message || "This entry would exceed the project budget and cannot be saved."}
                  </AlertDescription>
                </Alert>
              )}

              {/* Budget Override Alert - Show when admin can override */}
              {!showWorkingDaysWarning && !showWeekendWarning && !isEmployeeBudgetBlocked && showBudgetOverride && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <div className="font-medium">Admin Override Available</div>
                    {budgetValidation?.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Budget Warning Alert - Show when approaching budget limit */}
              {!showWorkingDaysWarning && !showWeekendWarning && !isEmployeeBudgetBlocked && !showBudgetOverride && showBudgetWarning && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    {budgetValidation?.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Budget Status Display - Show current budget info when valid */}
              {!showWorkingDaysWarning && !showWeekendWarning && budgetValidation && budgetValidation.totalBudget > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg border">
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
                  {(budgetChecking || isValidating) && (
                    <div className="mt-2 text-xs text-gray-500">Validating budget...</div>
                  )}
                </div>
              )}

              {/* Show validation info for allowed entries */}
              {!showWorkingDaysWarning && !showWeekendWarning && validation.daysRemaining > 0 && isNewEntry && (
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    {validation.getValidationMessage()}
                  </AlertDescription>
                </Alert>
              )}

              {/* Show weekend allowed info for admins */}
              {isWeekendDate && canLogWeekend && isAdmin && (
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    Weekend entry allowed (Admin privilege).
                  </AlertDescription>
                </Alert>
              )}

              {/* Form Content */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                  <EntryTypeSelector control={form.control} />
                  
                  {entryType === "project" ? (
                    <ProjectSelector control={form.control} projects={projects} />
                  ) : (
                    <ContractSelector control={form.control} />
                  )}
                  
                  <TimeInput control={form.control} />

                  <TaskDetails control={form.control} />
                </form>
              </Form>
            </div>
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="flex-shrink-0 pt-4 border-t gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={form.handleSubmit(handleSubmit)}
              className={`px-6 ${isEmployeeBudgetBlocked ? 'bg-red-600 hover:bg-red-700' : ''}`}
              disabled={isSaveDisabled}
              variant={isEmployeeBudgetBlocked ? "destructive" : "default"}
            >
              {getSaveButtonText()}
            </Button>
          </DialogFooter>
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
