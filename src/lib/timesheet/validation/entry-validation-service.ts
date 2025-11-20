
import { TimesheetEntry } from "../types";

export const validateEntryData = (entry: TimesheetEntry): void => {
  console.log("=== VALIDATING TIMESHEET ENTRY ===");
  console.log("Entry data:", entry);
  
  // Basic validation only
  if (!entry.entry_date) {
    throw new Error("Entry date is required");
  }
  if (!entry.hours_logged || entry.hours_logged <= 0) {
    throw new Error("Hours logged must be greater than 0");
  }
  if (!entry.start_time || !entry.end_time) {
    throw new Error("Start and end times are required");
  }
};
