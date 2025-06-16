
// Define all the shared types for the timesheet functionality

export interface Project {
  id: string;
  name: string;
  description?: string;
  budget_hours: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  hours_used?: number;  
  customer_id?: string;
  is_internal?: boolean;
}

export interface Contract {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'pending_renewal' | 'renewed';
  is_active?: boolean;
  customer_id?: string;
}

export interface TimesheetEntry {
  id?: string;
  user_id?: string;
  entry_date: string;
  hours_logged: number;
  notes?: string;
  jira_task_id?: string;
  start_time?: string;
  end_time?: string;
  entry_type: 'project' | 'contract';
  user_full_name?: string; // Cached user name from database
  // Either project_id OR contract_id will be set, never both
  project_id?: string;
  contract_id?: string;
  // Related data that gets joined
  project?: Project;
  contract?: Contract;
  user?: {
    id: string;
    full_name?: string;
    email?: string;
    organization?: string;
    time_zone?: string;
    employee_card_id?: string;
  };
}

// Legacy interface for backwards compatibility
export interface ContractTimeEntry extends Omit<TimesheetEntry, 'entry_type' | 'project_id'> {
  contract_id: string;
  user_id: string;
}

// Type for creating new entries - user_id is omitted since trigger handles it
export interface CreateTimesheetEntry {
  entry_date: string;
  hours_logged: number;
  notes?: string;
  jira_task_id?: string;
  start_time?: string;
  end_time?: string;
  entry_type: 'project' | 'contract';
  project_id?: string;
  contract_id?: string;
}

// Type for updating entries - user_id should not be changed
export interface UpdateTimesheetEntry extends CreateTimesheetEntry {
  id: string;
}

// Union type for both entry types
export type AnyTimeEntry = TimesheetEntry | ContractTimeEntry;
