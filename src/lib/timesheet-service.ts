
// Main export file that re-exports all timesheet functionality
import { Project, TimesheetEntry, CreateTimesheetEntry, UpdateTimesheetEntry, Contract } from "./timesheet/types";
import { ProjectAssignment, CreateProjectAssignment, ProjectWithAssignees } from "./timesheet/assignment-types";
import { ContractTimeEntry } from "./contract-service";
import { 
  fetchUserProjects, 
  getProjectHoursUsed, 
  updateProjectStatus,
  fetchProjects,
  fetchProjectsWithAssignees,
  saveProject
} from "./timesheet/project-service";
import { 
  fetchTimesheetEntries,
  fetchReportData,
  saveTimesheetEntry,
  duplicateTimesheetEntry,
  deleteTimesheetEntry,
  deleteAllTimesheetEntries
} from "./timesheet/entry-service";
import {
  fetchProjectAssignments,
  createProjectAssignment,
  deleteProjectAssignment,
  bulkAssignUsersToProject,
  removeUserFromProject
} from "./timesheet/assignment-service";

// Re-export all types and functions
export type { 
  Project, 
  TimesheetEntry, 
  CreateTimesheetEntry, 
  UpdateTimesheetEntry, 
  Contract, 
  ContractTimeEntry,
  ProjectAssignment,
  CreateProjectAssignment,
  ProjectWithAssignees
};

export {
  // Project related functions
  fetchUserProjects,
  fetchProjects,
  fetchProjectsWithAssignees,
  saveProject,
  getProjectHoursUsed,
  updateProjectStatus,
  
  // Entry related functions
  fetchTimesheetEntries,
  fetchReportData,
  saveTimesheetEntry,
  duplicateTimesheetEntry,
  deleteTimesheetEntry,
  deleteAllTimesheetEntries,
  
  // Assignment related functions
  fetchProjectAssignments,
  createProjectAssignment,
  deleteProjectAssignment,
  bulkAssignUsersToProject,
  removeUserFromProject
};
