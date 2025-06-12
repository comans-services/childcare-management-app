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
import { Calendar, AlertTriangle, AlertCircle, Lock } from "lucide-react";
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
import { checkIfDateLocked } from "@/lib/timesheet-lock-service";
import { useIsMobile } from "@/hooks/use-mobile";

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
  entries: TimesheetEntry[];
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
  entries = [],
}) => {
  const { userRole } = useAuth();
  const isMobile = useIsMobile();
  const isAdmin = userRole === "admin";
  const [entryType, setEntryType] = useState<"project" | "contract">("project");
  const [weekendApprovalOpen, setWeekendApprovalOpen] = useState(false);
  const [budgetValidation, setBudgetValidation] = useState<BudgetValidation | null>(null);
  const [budgetChecking, setBudgetChecking] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isDateLocked, setIsDateLocked] = useState(false);
  const [lockCheckLoading, setLockCheckLoading] = useState(false);

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

  // Check if date is locked
  useEffect(() => {
    const checkLockStatus = async () => {
      if (!open || !userId) return;
      
      setLockCheckLoading(true);
      try {
        const locked = await checkIfDateLocked(userId, formatDate(date));
        setIsDateLocked(locked);
      } catch (error) {
        console.error("Error checking lock status:", error);
        setIsDateLocked(false);
      } finally {
        setLockCheckLoading(false);
      }
    };

    checkLockStatus();
  }, [open, userId, date]);

  // Budget validation for save blocking
  const checkBudget = useCallback(async () => {
    if (watchedEntryType !== "project" || !watchedProjectId || !watchedHours || watchedHours <= 0) {
      setBudgetValidation(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    setBudgetChecking(true);
    
    try {
      const validation = await validateProjectBudget({
        projectId: watchedProjectId,
        hoursToAdd: Number(watchedHours),
        existingEntryId: existingEntry?.id,
        userId
      });

      setBudgetValidation(validation);
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
  
  // Working days validation
  const canAddToThisDate = validation.canAddToDate(date);
  const showWorkingDaysWarning = isNewEntry && !canAddToThisDate;

  // Weekend validation with admin override integration
  const weekendValidation = validateWeekendEntry(date);
  const canLogWeekend = weekendValidation.isValid;
  const showWeekendWarning = isWeekendDate && !canLogWeekend && isNewEntry;

  // Budget validation - different messages for admin vs employee
  const showBudgetError = budgetValidation && !budgetValidation.isValid && !budgetValidation.canOverride;
  const isEmployeeBudgetBlocked = budgetValidation && !budgetValidation.isValid && !isAdmin;

  const handleSubmit = async (values: TimeEntryFormValues) => {
    // Priority validation order: lock status first, then working days, then weekend, then budget
    if (isDateLocked && !isAdmin) {
      toast({
        title: "Timesheet Locked",
        description: "Timesheet entries are locked for this date. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    if (isNewEntry && !canAddToThisDate) {
      toast({
        title: "Cannot add entry",
        description: validation.getValidationMessage(),
        variant: "destructive",
      });
      return;
    }

    if (isNewEntry && showWeekendWarning) {
      setWeekendApprovalOpen(true);
      return;
    }

    // Block employees from exceeding budget
    if (isEmployeeBudgetBlocked) {
      toast({
        title: "Budget Exceeded",
        description: "This entry would exceed the project budget. Please contact your administrator.",
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

  const isSaveDisabled = (isDateLocked && !isAdmin) ||
                        showWorkingDaysWarning || 
                        showWeekendWarning || 
                        isEmployeeBudgetBlocked || 
                        isValidating || 
                        budgetChecking ||
                        lockCheckLoading;

  const getSaveButtonText = () => {
    if (lockCheckLoading) return "Checking Lock Status...";
    if (isDateLocked && !isAdmin) return "Date Locked";
    if (isValidating || budgetChecking) return "Checking Budget...";
    if (isEmployeeBudgetBlocked) return "Budget Exceeded";
    return "Save";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`
          flex flex-col max-h-[95vh]
          ${isMobile 
            ? 'w-[95vw] max-w-[95vw] h-[95vh] p-3' 
            : 'dialog-responsive-xl'
          }
          2xl:max-w-[1000px] 2xl:grid 2xl:grid-cols-2 2xl:gap-6
          3xl:max-w-[1200px]
        `}>
          {/* Header - spans full width on ultra-wide */}
          <DialogHeader className={`
            flex-shrink-0 
            ${isMobile ? 'pb-3' : 'pb-4 lg:pb-6'}
            2xl:col-span-2
          `}>
            <DialogTitle className="text-fluid-xl lg:text-fluid-2xl">
              {existingEntry ? "Edit time entry" : "Add time"}
            </DialogTitle>
          </DialogHeader>
          
          {/* Left column on ultra-wide: Date info and alerts */}
          <div className={`
            flex-1 overflow-y-auto min-h-0 space-y-4 lg:space-y-6
            ${isMobile ? 'px-1' : 'px-2'}
            2xl:overflow-visible 2xl:space-y-4
          `}>
            {/* Date display */}
            <div className="flex items-center">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
              </div>
              <span className="text-fluid-md lg:text-fluid-lg font-medium">
                {format(date, "EEE, MMM d, yyyy")}
              </span>
              {isWeekendDate && (
                <div className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  Weekend
                </div>
              )}
              {isDateLocked && (
                <div className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </div>
              )}
            </div>

            {/* Lock status alert */}
            {isDateLocked && !isAdmin && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertDescription className="text-fluid-sm">
                  Timesheet entries are locked for this date. Please contact your administrator to make changes.
                </AlertDescription>
              </Alert>
            )}

            {/* Admin lock override notice */}
            {isDateLocked && isAdmin && (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription className="text-fluid-sm">
                  This date is locked for regular users, but you can override as an administrator.
                </AlertDescription>
              </Alert>
            )}

            {/* Validation alerts */}
            {showWorkingDaysWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-fluid-sm">
                  {validation.getValidationMessage()}
                </AlertDescription>
              </Alert>
            )}

            {!showWorkingDaysWarning && showWeekendWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-fluid-sm">
                  Weekend entries are not allowed. Please contact your administrator for approval.
                </AlertDescription>
              </Alert>
            )}

            {!showWorkingDaysWarning && !showWeekendWarning && isEmployeeBudgetBlocked && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium text-fluid-sm">Budget Exceeded</div>
                  <div className="text-fluid-xs">This project is over budget. Please contact your administrator.</div>
                </AlertDescription>
              </Alert>
            )}

            {/* Admin budget info */}
            {!showWorkingDaysWarning && !showWeekendWarning && !isEmployeeBudgetBlocked && isAdmin && budgetValidation && budgetValidation.totalBudget > 0 && (
              <div className="p-3 lg:p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between text-fluid-sm">
                  <span className="text-gray-600">Project Budget:</span>
                  <span className="font-medium">
                    {budgetValidation.hoursUsed.toFixed(1)} / {budgetValidation.totalBudget.toFixed(1)} hours used
                    {budgetValidation.remainingHours > 0 && (
                      <span className="ml-2 text-gray-500 hidden sm:inline">
                        ({budgetValidation.remainingHours.toFixed(1)}h remaining)
                      </span>
                    )}
                  </span>
                </div>
                {(budgetChecking || isValidating) && (
                  <div className="mt-2 text-fluid-xs text-gray-500">Validating budget...</div>
                )}
              </div>
            )}

            {/* Validation info for allowed entries */}
            {!showWorkingDaysWarning && !showWeekendWarning && validation.daysRemaining > 0 && isNewEntry && (
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription className="text-fluid-sm">
                  {validation.getValidationMessage()}
                </AlertDescription>
              </Alert>
            )}

            {/* Weekend allowed info for admins */}
            {isWeekendDate && canLogWeekend && isAdmin && (
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription className="text-fluid-sm">
                  Weekend entry allowed (Admin privilege).
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right column on ultra-wide: Form content */}
          <div className={`
            flex-1 overflow-y-auto min-h-0
            ${isMobile ? 'px-1' : 'px-2'}
            2xl:overflow-visible
          `}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 lg:space-y-6">
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

          {/* Footer - spans full width on ultra-wide */}
          <DialogFooter className={`
            flex-shrink-0 border-t
            ${isMobile ? 'pt-3 mt-3' : 'pt-4 lg:pt-6 mt-4 lg:mt-6'}
            2xl:col-span-2
          `}>
            <div className={`
              flex w-full gap-3 
              ${isMobile ? 'flex-col' : 'sm:justify-end'}
            `}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                className={isMobile ? 'w-full' : ''}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={form.handleSubmit(handleSubmit)}
                className={`
                  ${isMobile ? 'w-full' : 'px-8'} 
                  ${isEmployeeBudgetBlocked ? 'bg-red-600 hover:bg-red-700' : ''}
                `}
                disabled={isSaveDisabled}
                variant={isEmployeeBudgetBlocked ? "destructive" : "default"}
              >
                {getSaveButtonText()}
              </Button>
            </div>
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
