
// Main export file that re-exports all timesheet functionality
import { Project, TimesheetEntry, CreateTimesheetEntry, UpdateTimesheetEntry, Contract } from "./timesheet/types";
import { ContractTimeEntry } from "./contract-service";
import { 
  fetchUserProjects, 
  getProjectHoursUsed, 
  updateProjectStatus 
} from "./timesheet/project-service";
import { 
  fetchTimesheetEntries,
  fetchReportData,
  saveTimesheetEntry,
  duplicateTimesheetEntry,
  deleteTimesheetEntry,
  deleteAllTimesheetEntries
} from "./timesheet/entry-service";

// Re-export all types and functions
export type { Project, TimesheetEntry, CreateTimesheetEntry, UpdateTimesheetEntry, Contract, ContractTimeEntry };

export {
  // Project related functions
  fetchUserProjects,
  getProjectHoursUsed,
  updateProjectStatus,
  
  // Entry related functions
  fetchTimesheetEntries,
  fetchReportData,
  saveTimesheetEntry,
  duplicateTimesheetEntry,
  deleteTimesheetEntry,
  deleteAllTimesheetEntries
};
