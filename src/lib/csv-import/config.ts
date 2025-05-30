
import { validateProjectRow, validateCustomerRow, validateContractRow, validateTeamMemberRow, validateTimesheetEntryRow } from "@/lib/csv-validation";

export type EntityType = 'projects' | 'customers' | 'contracts' | 'team-members' | 'timesheet-entries';

export const ENTITY_LABELS = {
  projects: 'Projects',
  customers: 'Customers', 
  contracts: 'Contracts',
  'team-members': 'Team Members',
  'timesheet-entries': 'Timesheet Entries'
};

export const REQUIRED_HEADERS = {
  projects: ['name', 'budget_hours'],
  customers: ['name'],
  contracts: ['name', 'start_date', 'end_date', 'status'],
  'team-members': ['email', 'password'],
  'timesheet-entries': ['project_name', 'entry_date', 'hours_logged']
};

export const VALIDATORS = {
  projects: validateProjectRow,
  customers: validateCustomerRow,
  contracts: validateContractRow,
  'team-members': validateTeamMemberRow,
  'timesheet-entries': validateTimesheetEntryRow
};

export const BATCH_SIZE = 50;
