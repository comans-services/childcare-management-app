
import { TimesheetEntry } from "../types";

export const validateEntryData = (entry: TimesheetEntry): void => {
  console.log("=== VALIDATING TIMESHEET ENTRY ===");
  console.log("Entry data:", entry);
  
  // Validate entry type and corresponding ID
  if (entry.entry_type === 'project' && !entry.project_id) {
    throw new Error("Project ID is required for project entries");
  }
  if (entry.entry_type === 'contract' && !entry.contract_id) {
    throw new Error("Contract ID is required for contract entries");
  }
};
