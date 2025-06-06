
import { TimesheetEntry } from "./types";
import { validateWeekendEntry } from "./validation/weekend-validation-service";
import { validateEntryData, validateProjectBudgetForEntry } from "./validation/entry-validation-service";
import { createTimesheetEntry } from "./operations/entry-create-service";
import { updateTimesheetEntry } from "./operations/entry-update-service";
import { deleteTimesheetEntry, deleteAllTimesheetEntries } from "./operations/entry-delete-service";
import { duplicateTimesheetEntry } from "./operations/entry-duplicate-service";
import { logBudgetOverride, logEntryEvent } from "./audit-service";
import { validateProjectBudget, getProjectHoursUsed } from "./validation/budget-validation-service";
import { supabase } from "@/integrations/supabase/client";

export const saveTimesheetEntry = async (entry: TimesheetEntry): Promise<TimesheetEntry> => {
  try {
    console.log("=== STARTING ENTRY SAVE PROCESS ===");
    
    // Step 1: Validate basic entry data
    validateEntryData(entry);

    // Step 2: Server-side weekend validation
    const weekendValidation = await validateWeekendEntry(entry.entry_date);
    if (!weekendValidation.isValid) {
      console.error("Weekend validation failed:", weekendValidation.message);
      throw new Error(weekendValidation.message || "Weekend entry not allowed");
    }

    // Step 3: Get current user for admin override checks
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error during entry save:", authError);
      throw new Error("Authentication required");
    }

    // Step 4: Budget validation for project entries
    let budgetOverrideUsed = false;
    if (entry.entry_type === 'project' && entry.project_id) {
      const budgetValidation = await validateProjectBudget({
        projectId: entry.project_id,
        hoursToAdd: entry.hours_logged,
        existingEntryId: entry.id,
        userId: user.id
      });

      // If budget is exceeded and user cannot override, block the save
      if (!budgetValidation.isValid && !budgetValidation.canOverride) {
        console.error("Budget validation failed - user cannot override:", budgetValidation.message);
        throw new Error(budgetValidation.message || "Budget validation failed");
      }

      // If budget is exceeded but user can override, allow save with audit logging
      if (!budgetValidation.isValid && budgetValidation.canOverride) {
        budgetOverrideUsed = true;
        console.log("Admin budget override is being used");
      }
    }
    
    console.log("All validations passed, proceeding with save");
    
    // Save the entry
    let savedEntry: TimesheetEntry;
    if (entry.id) {
      savedEntry = await updateTimesheetEntry(entry);
      await logEntryEvent(user.id, 'entry_updated', savedEntry.id!, {
        project_id: entry.project_id,
        hours_logged: entry.hours_logged,
        entry_date: entry.entry_date,
        entry_type: entry.entry_type
      });
    } else {
      savedEntry = await createTimesheetEntry(entry);
      await logEntryEvent(user.id, 'entry_created', savedEntry.id!, {
        project_id: entry.project_id,
        hours_logged: entry.hours_logged,
        entry_date: entry.entry_date,
        entry_type: entry.entry_type
      });
    }

    // Log budget override if it was used
    if (budgetOverrideUsed && entry.project_id) {
      const hoursUsedAfter = await getProjectHoursUsed(entry.project_id);
      const budgetValidation = await validateProjectBudget({
        projectId: entry.project_id,
        hoursToAdd: 0, // Just get current status
        userId: user.id
      });

      await logBudgetOverride(user.id, entry.project_id, savedEntry.id!, {
        hoursAdded: entry.hours_logged,
        totalBudget: budgetValidation.totalBudget,
        hoursUsedBefore: budgetValidation.hoursUsed - entry.hours_logged,
        hoursUsedAfter: budgetValidation.hoursUsed,
        excessHours: Math.max(0, budgetValidation.hoursUsed - budgetValidation.totalBudget)
      });
    }

    return savedEntry;
  } catch (error) {
    console.error("Error in saveTimesheetEntry:", error);
    throw error;
  }
};

// Re-export all the other functions
export { duplicateTimesheetEntry, deleteTimesheetEntry, deleteAllTimesheetEntries };
