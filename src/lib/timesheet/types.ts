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
  has_budget_limit?: boolean;
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
  user_id: string;
  entry_date: string;
  hours_logged: number;
  start_time: string;
  end_time: string;
  break_minutes: number;
  tea_break_minutes: number;
  user_full_name?: string; // Cached user name from database
  created_at?: string;
  updated_at?: string;
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

// Type for creating new entries - user_id is optional for admin editing
export interface CreateTimesheetEntry {
  entry_date: string;
  hours_logged: number;
  start_time: string;
  end_time: string;
  break_minutes: number;
  tea_break_minutes: number;
  user_id: string; // Required for DB insert
}

// Type for updating entries - user_id should not be changed
export interface UpdateTimesheetEntry extends CreateTimesheetEntry {
  id: string;
}

// Union type for both entry types
export type AnyTimeEntry = TimesheetEntry | ContractTimeEntry;
