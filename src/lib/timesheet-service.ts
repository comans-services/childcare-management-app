// Main export file that re-exports all timesheet functionality
import { TimesheetEntry, CreateTimesheetEntry, UpdateTimesheetEntry, Project } from "./timesheet/types";
import { 
  fetchTimesheetEntries,
  fetchReportData
} from "./timesheet/entry-fetch-service";
import {
  saveTimesheetEntry,
  duplicateTimesheetEntry,
  deleteTimesheetEntry,
  deleteAllTimesheetEntries
} from "./timesheet/entry-mutation-service";

// Re-export all types and functions
export type { 
  TimesheetEntry, 
  CreateTimesheetEntry, 
  UpdateTimesheetEntry,
  Project
};

// Stub functions for projects - tables don't exist
export const fetchUserProjects = async (): Promise<Project[]> => {
  console.log("Note: Projects table does not exist. Returning empty array.");
  return [];
};

export {
  // Entry related functions
  fetchTimesheetEntries,
  fetchReportData,
  saveTimesheetEntry,
  duplicateTimesheetEntry,
  deleteTimesheetEntry,
  deleteAllTimesheetEntries
};
export type { 
  TimesheetEntry, 
  CreateTimesheetEntry, 
  UpdateTimesheetEntry
};

export {
  // Entry related functions
  fetchTimesheetEntries,
  fetchReportData,
  saveTimesheetEntry,
  duplicateTimesheetEntry,
  deleteTimesheetEntry,
  deleteAllTimesheetEntries
};
