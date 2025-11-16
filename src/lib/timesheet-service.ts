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

export type { 
  TimesheetEntry, 
  CreateTimesheetEntry, 
  UpdateTimesheetEntry,
  Project
};

export const fetchUserProjects = async (): Promise<Project[]> => {
  console.log("Note: Projects table does not exist. Returning empty array.");
  return [];
};

export {
  fetchTimesheetEntries,
  fetchReportData,
  saveTimesheetEntry,
  duplicateTimesheetEntry,
  deleteTimesheetEntry,
  deleteAllTimesheetEntries
};
