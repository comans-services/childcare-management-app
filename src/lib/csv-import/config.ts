
import { validateProjectRow, validateCustomerRow, validateContractRow, validateTeamMemberRow } from "@/lib/csv-validation";

export type EntityType = 'projects' | 'customers' | 'contracts' | 'team-members';

export const ENTITY_LABELS = {
  projects: 'Projects',
  customers: 'Customers', 
  contracts: 'Contracts',
  'team-members': 'Team Members'
};

export const REQUIRED_HEADERS = {
  projects: ['name', 'budget_hours'],
  customers: ['name'],
  contracts: ['name', 'start_date', 'end_date', 'status'],
  'team-members': ['email', 'password']
};

export const VALIDATORS = {
  projects: validateProjectRow,
  customers: validateCustomerRow,
  contracts: validateContractRow,
  'team-members': validateTeamMemberRow
};

export const BATCH_SIZE = 50;
