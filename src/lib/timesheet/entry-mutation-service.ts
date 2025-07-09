
import { TimesheetEntry } from "./types";
import { validateWeekendEntry } from "./validation/weekend-validation-service";
import { validateHolidayEntry } from "./validation/holiday-validation-service";
import { validateEntryData, validateProjectBudgetForEntry } from "./validation/entry-validation-service";
import { createTimesheetEntry } from "./operations/entry-create-service";
import { updateTimesheetEntry } from "./operations/entry-update-service";
import { deleteTimesheetEntry, deleteAllTimesheetEntries } from "./operations/entry-delete-service";
import { duplicateTimesheetEntry } from "./operations/entry-duplicate-service";
import { validateProjectBudget, getProjectHoursUsed } from "./validation/budget-validation-service";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/utils/roles";

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

    // Step 3: Enhanced server-side holiday validation
    const holidayValidation = await validateHolidayEntry(entry.entry_date);
    if (!holidayValidation.isValid) {
      console.error("Holiday validation failed:", holidayValidation.message);
      throw new Error(holidayValidation.message || "Holiday entry not allowed");
    }

    // Step 4: Get current user for admin override checks
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error during entry save:", authError);
      throw new Error("Authentication required");
    }

    console.log("=== AUTHENTICATED USER ===", user.id);

    // Step 5: Check if user is admin for enhanced permissions
    const userIsAdmin = await isAdmin(user);
    console.log("User is admin:", userIsAdmin);

    // Step 6: Critical budget validation for project entries
    let budgetOverrideUsed = false;
    if (entry.entry_type === 'project' && entry.project_id) {
      console.log("=== BACKEND BUDGET VALIDATION ===");
      
      // For budget validation, use the target user (could be different for admin editing)
      const targetUserId = entry.user_id || user.id;
      
      const budgetValidation = await validateProjectBudget({
        projectId: entry.project_id,
        hoursToAdd: entry.hours_logged,
        existingEntryId: entry.id,
        userId: targetUserId
      });

      console.log("Backend budget validation result:", budgetValidation);
      console.log("User can override:", budgetValidation.canOverride);
      console.log("Budget is valid:", budgetValidation.isValid);

      // Critical: Block non-admin users from exceeding budget
      if (!budgetValidation.isValid && !userIsAdmin) {
        console.error("BACKEND BLOCKING: Non-admin user attempting to exceed budget");
        console.error("Budget message:", budgetValidation.message);
        throw new Error(budgetValidation.message || "Budget exceeded - entry blocked by server");
      }

      // If budget is exceeded but user is admin, allow with logging
      if (!budgetValidation.isValid && userIsAdmin) {
        budgetOverrideUsed = true;
        console.log("Admin budget override being applied by server");
      }
    }
    
    console.log("All validations passed, proceeding with save");
    
    // Save the entry - database triggers will handle user_id and user_full_name assignment
    let savedEntry: TimesheetEntry;
    const isUpdate = !!entry.id;
    
    if (isUpdate) {
      console.log("=== UPDATING EXISTING ENTRY ===", entry.id);
      savedEntry = await updateTimesheetEntry(entry);
    } else {
      console.log("=== CREATING NEW ENTRY ===");
      savedEntry = await createTimesheetEntry(entry);
    }

    // Budget override logging is now handled by the database function
    if (budgetOverrideUsed) {
      console.log("=== BUDGET OVERRIDE OCCURRED ===");
      console.log("Admin override applied - tracked by database function");
    }

    console.log("=== ENTRY SAVE COMPLETED SUCCESSFULLY ===");
    return savedEntry;
  } catch (error) {
    console.error("Error in saveTimesheetEntry:", error);
    throw error;
  }
};

// Re-export all the other functions
export { duplicateTimesheetEntry, deleteTimesheetEntry, deleteAllTimesheetEntries };
