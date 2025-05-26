
// Main export file that re-exports all timesheet functionality
import { Project, TimesheetEntry } from "./timesheet/types";
import { 
  fetchUserProjects, 
  getProjectHoursUsed, 
  updateProjectStatus 
} from "./timesheet/project-service";
import { 
  fetchTimesheetEntries,
  saveTimesheetEntry,
  duplicateTimesheetEntry,
  deleteTimesheetEntry,
  deleteAllTimesheetEntries
} from "./timesheet/entry-service";

// Re-export all types and functions

export const fetchTimesheetEntries = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  includeUserData = false
): Promise<TimesheetEntry[]> => {
  if (!userId) {
    throw new Error("fetchTimesheetEntries: userId is required");
  }

  console.log("API call to fetchTimesheetEntries", {
    userId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    includeUserData,
  });

export type { Project, TimesheetEntry };

export {
  // Project related functions
  fetchUserProjects,
  getProjectHoursUsed,
  updateProjectStatus,
  
  // Entry related functions
  fetchTimesheetEntries,
  saveTimesheetEntry,
  duplicateTimesheetEntry,
  deleteTimesheetEntry,
  deleteAllTimesheetEntries
};
