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

    console.log("=== AUTHENTICATED USER ===", user.id);

    // Step 4: Get user role for budget validation
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      throw new Error("Failed to verify user permissions");
    }

    const userRole = profileData?.role;
    const isAdmin = userRole === "admin";

    console.log("User role:", userRole, "Is Admin:", isAdmin);

    // Step 5: Critical budget validation for project entries
    let budgetOverrideUsed = false;
    if (entry.entry_type === 'project' && entry.project_id) {
      console.log("=== BACKEND BUDGET VALIDATION ===");
      
      const budgetValidation = await validateProjectBudget({
        projectId: entry.project_id,
        hoursToAdd: entry.hours_logged,
        existingEntryId: entry.id,
        userId: user.id
      });

      console.log("Backend budget validation result:", budgetValidation);
      console.log("User can override:", budgetValidation.canOverride);
      console.log("Budget is valid:", budgetValidation.isValid);

      // Critical: Block non-admin users from exceeding budget
      if (!budgetValidation.isValid && !isAdmin) {
        console.error("BACKEND BLOCKING: Non-admin user attempting to exceed budget");
        console.error("User role:", userRole);
        console.error("Budget message:", budgetValidation.message);
        throw new Error(budgetValidation.message || "Budget exceeded - entry blocked by server");
      }

      // If budget is exceeded but user is admin, allow with audit logging
      if (!budgetValidation.isValid && isAdmin) {
        budgetOverrideUsed = true;
        console.log("Admin budget override being applied by server");
      }
    }
    
    console.log("All validations passed, proceeding with save");
    
    // Save the entry
    let savedEntry: TimesheetEntry;
    const isUpdate = !!entry.id;
    
    if (isUpdate) {
      console.log("=== UPDATING EXISTING ENTRY ===", entry.id);
      savedEntry = await updateTimesheetEntry(entry);
      
      console.log("=== LOGGING UPDATE AUDIT EVENT ===");
      await logEntryEvent(user.id, 'entry_updated', savedEntry.id!, {
        project_id: entry.project_id,
        hours_logged: entry.hours_logged,
        entry_date: entry.entry_date,
        entry_type: entry.entry_type,
        notes: entry.notes
      });
    } else {
      console.log("=== CREATING NEW ENTRY ===");
      savedEntry = await createTimesheetEntry(entry);
      
      console.log("=== LOGGING CREATE AUDIT EVENT ===", savedEntry.id);
      await logEntryEvent(user.id, 'entry_created', savedEntry.id!, {
        project_id: entry.project_id,
        hours_logged: entry.hours_logged,
        entry_date: entry.entry_date,
        entry_type: entry.entry_type,
        notes: entry.notes
      });
    }

    // Log budget override if it was used
    if (budgetOverrideUsed && entry.project_id) {
      console.log("=== LOGGING BUDGET OVERRIDE ===");
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

    console.log("=== ENTRY SAVE COMPLETED SUCCESSFULLY ===");
    return savedEntry;
  } catch (error) {
    console.error("Error in saveTimesheetEntry:", error);
    throw error;
  }
};

// Re-export all the other functions
export { duplicateTimesheetEntry, deleteTimesheetEntry, deleteAllTimesheetEntries };
