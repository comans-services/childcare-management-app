
import { TimesheetEntry } from "./types";
import { validateWeekendEntry } from "./validation/weekend-validation-service";
import { validateEntryData } from "./validation/entry-validation-service";
import { createTimesheetEntry } from "./operations/entry-create-service";
import { updateTimesheetEntry } from "./operations/entry-update-service";
import { deleteTimesheetEntry, deleteAllTimesheetEntries } from "./operations/entry-delete-service";
import { duplicateTimesheetEntry } from "./operations/entry-duplicate-service";

export const saveTimesheetEntry = async (entry: TimesheetEntry): Promise<TimesheetEntry> => {
  try {
    // Validate entry data
    validateEntryData(entry);

    // Server-side weekend validation
    const weekendValidation = await validateWeekendEntry(entry.entry_date);
    if (!weekendValidation.isValid) {
      console.error("Weekend validation failed:", weekendValidation.message);
      throw new Error(weekendValidation.message || "Weekend entry not allowed");
    }
    
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
