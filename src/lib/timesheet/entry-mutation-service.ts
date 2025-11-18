
import { TimesheetEntry } from "./types";
import { validateWeekendEntry } from "./validation/weekend-validation-service";
import { validateHolidayEntry } from "./validation/holiday-validation-service";
import { validateEntryData } from "./validation/entry-validation-service";
import { createTimesheetEntry } from "./operations/entry-create-service";
import { updateTimesheetEntry } from "./operations/entry-update-service";
import { deleteTimesheetEntry, deleteAllTimesheetEntries } from "./operations/entry-delete-service";
import { duplicateTimesheetEntry } from "./operations/entry-duplicate-service";
import { supabase } from "@/integrations/supabase/client";

const checkForDuplicateEntry = async (userId: string, entryDate: string, entryId?: string): Promise<boolean> => {
  const query = supabase
    .from("timesheet_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("entry_date", entryDate);
  
  // If updating, exclude the current entry from the check
  if (entryId) {
    query.neq("id", entryId);
  }
  
  const { data } = await query.maybeSingle();
  
  return !!data;
};

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

    // Step 4: Check for duplicate entry on the same day
    if (!entry.id) {
      const hasDuplicate = await checkForDuplicateEntry(entry.user_id, entry.entry_date);
      if (hasDuplicate) {
        throw new Error("You already have a shift logged for this day. Please edit or delete the existing entry first.");
      }
    } else {
      // When updating, check if there's another entry on this date
      const hasDuplicate = await checkForDuplicateEntry(entry.user_id, entry.entry_date, entry.id);
      if (hasDuplicate) {
        throw new Error("Another shift already exists for this day. Please delete it first.");
      }
    }
    
    console.log("All validations passed, proceeding with save");
    
    // Save the entry
    let savedEntry: TimesheetEntry;
    const isUpdate = !!entry.id;
    
    if (isUpdate) {
      console.log("=== UPDATING EXISTING ENTRY ===", entry.id);
      savedEntry = await updateTimesheetEntry(entry);
    } else {
      console.log("=== CREATING NEW ENTRY ===");
      savedEntry = await createTimesheetEntry(entry);
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
