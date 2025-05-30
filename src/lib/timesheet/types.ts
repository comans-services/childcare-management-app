
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
}

export interface TimesheetEntry {
  id?: string;
  project_id: string;
  user_id?: string; // Made optional since DB trigger will set this
  entry_date: string;
  hours_logged: number;
  notes?: string;
  jira_task_id?: string;
  start_time?: string;
  end_time?: string;
  project?: Project;
  user?: {
    id: string;
    full_name?: string;
    email?: string;
    organization?: string;
    time_zone?: string;
    employee_card_id?: string;
  };
}

// Type for creating new entries - user_id is completely omitted since trigger handles it
export interface CreateTimesheetEntry {
  project_id: string;
  entry_date: string;
  hours_logged: number;
  notes?: string;
  jira_task_id?: string;
  start_time?: string;
  end_time?: string;
}

// Type for updating entries - user_id should not be changed
export interface UpdateTimesheetEntry extends CreateTimesheetEntry {
  id: string;
}
