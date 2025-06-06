
import { TimesheetEntry } from "./types";
import { validateWeekendEntry } from "./validation/weekend-validation-service";
import { validateEntryData, validateProjectBudgetForEntry } from "./validation/entry-validation-service";
import { createTimesheetEntry } from "./operations/entry-create-service";
import { updateTimesheetEntry } from "./operations/entry-update-service";
import { deleteTimesheetEntry, deleteAllTimesheetEntries } from "./operations/entry-delete-service";
import { duplicateTimesheetEntry } from "./operations/entry-duplicate-service";
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
    await validateProjectBudgetForEntry(entry, user.id);
    
    console.log("All validations passed, proceeding with save");
    
    // Save the entry
    if (entry.id) {
      return await updateTimesheetEntry(entry);
    } else {
      return await createTimesheetEntry(entry);
    }
  } catch (error) {
    console.error("Error in saveTimesheetEntry:", error);
    throw error;
  }
};

// Re-export all the other functions
export { duplicateTimesheetEntry, deleteTimesheetEntry, deleteAllTimesheetEntries };
