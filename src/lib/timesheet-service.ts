
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { formatDate } from "@/lib/date-utils";
import { Customer } from "@/lib/customer-service";

export interface ProjectTimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  entry_date: string;
  hours_logged: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  budget_hours: number;
  customer_id?: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    company?: string;
  };
  start_date?: string;
  end_date?: string;
  is_internal?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface Contract {
  id: string;
  name: string;
  description?: string;
  customer_id: string;
  customer_name?: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'pending_renewal' | 'expired' | 'renewed';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_id?: string;
  uploaded_at?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  days_until_expiry?: number;
  services?: Service[];
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectWithHours extends Project {
  total_hours: number;
}

export interface TimesheetEntry {
  id?: string;
  user_id?: string;
  project_id?: string;
  contract_id?: string;
  entry_date: string;
  hours_logged: number;
  notes?: string;
  jira_task_id?: string;
  start_time?: string;
  end_time?: string;
  entry_type?: 'project' | 'contract';
  created_at?: string;
  updated_at?: string;
  // Relational properties
  project?: Project;
  contract?: Contract;
  user?: User;
}

// Re-export from entry service
export {
  fetchTimesheetEntries,
  fetchReportData,
  saveTimesheetEntry,
  duplicateTimesheetEntry,
  deleteTimesheetEntry,
  deleteAllTimesheetEntries
} from "./timesheet/entry-service";

// Re-export contract functions
export { fetchUserContracts } from "./contract-service";

export const fetchProjects = async (): Promise<Project[]> => {
  console.log("Fetching projects...");

  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      customer:customers (
        id,
        name,
        email,
        company
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  console.log("Fetched projects:", data);
  return data || [];
};

export const fetchUserProjects = async (): Promise<Project[]> => {
  console.log("Fetching user projects...");
  
  const { data, error } = await supabase
    .from("project_assignments")
    .select(`
      projects (
        *,
        customer:customers (
          id,
          name,
          email,
          company
        )
      )
    `)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

  if (error) {
    console.error("Error fetching user projects:", error);
    throw new Error(`Failed to fetch user projects: ${error.message}`);
  }

  // Extract the projects from the assignments
  const projects = data?.map(assignment => assignment.projects).filter(Boolean) || [];
  
  console.log("Fetched user projects:", projects);
  return projects;
};

export const fetchProjectById = async (id: string): Promise<Project | null> => {
  console.log("Fetching project by ID:", id);

  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      customer:customers (
        id,
        name,
        email,
        company
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    if (error.code === 'PGRST116') {
      return null; // Project not found
    }
    throw new Error(`Failed to fetch project: ${error.message}`);
  }

  console.log("Fetched project:", data);
  return data;
};

export const fetchProjectTimeEntries = async (projectId: string): Promise<ProjectTimeEntry[]> => {
  console.log(`Fetching time entries for project ID: ${projectId}`);

  const { data, error } = await supabase
    .from("project_time_entries")
    .select("*")
    .eq("project_id", projectId)
    .order("entry_date", { ascending: false });

  if (error) {
    console.error("Error fetching time entries:", error);
    throw new Error(`Failed to fetch time entries: ${error.message}`);
  }

  console.log("Fetched time entries:", data);
  return data || [];
};

export const fetchUserTimeEntries = async (userId: string): Promise<TimesheetEntry[]> => {
  console.log(`Fetching time entries for user ID: ${userId}`);

  const { data, error } = await supabase
    .from("timesheet_entries")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false });

  if (error) {
    console.error("Error fetching time entries:", error);
    throw new Error(`Failed to fetch time entries: ${error.message}`);
  }

  console.log("Fetched time entries:", data);
  return data || [];
};

export const fetchAllTimeEntries = async (): Promise<TimesheetEntry[]> => {
  console.log("Fetching all time entries");

  const { data, error } = await supabase
    .from("timesheet_entries")
    .select("*")
    .order("entry_date", { ascending: false });

  if (error) {
    console.error("Error fetching time entries:", error);
    throw new Error(`Failed to fetch time entries: ${error.message}`);
  }

  console.log("Fetched time entries:", data);
  return data || [];
};

export const fetchTimeEntriesByDateRange = async (
  startDate: string,
  endDate: string
): Promise<TimesheetEntry[]> => {
  console.log(`Fetching time entries between ${startDate} and ${endDate}`);

  const { data, error } = await supabase
    .from("timesheet_entries")
    .select("*")
    .gte("entry_date", startDate)
    .lte("entry_date", endDate)
    .order("entry_date", { ascending: false });

  if (error) {
    console.error("Error fetching time entries:", error);
    throw new Error(`Failed to fetch time entries: ${error.message}`);
  }

  console.log("Fetched time entries:", data);
  return data || [];
};

export const fetchTimeEntriesForWeek = async (date: Date): Promise<TimesheetEntry[]> => {
  const start = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const end = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  return fetchTimeEntriesByDateRange(start, end);
};

export const fetchTimeEntriesForDate = async (date: Date): Promise<TimesheetEntry[]> => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    console.log(`Fetching time entries for date: ${formattedDate}`);

    const { data, error } = await supabase
        .from("timesheet_entries")
        .select("*")
        .eq("entry_date", formattedDate)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching time entries:", error);
        throw new Error(`Failed to fetch time entries: ${error.message}`);
    }

    console.log("Fetched time entries:", data);
    return data || [];
};

export const updateTimesheetEntry = async (id: string, entryData: TimesheetEntry): Promise<TimesheetEntry> => {
  console.log(`Updating timesheet entry with ID: ${id} and data:`, entryData);

  try {
    const { data, error } = await supabase
      .from("timesheet_entries")
      .update(entryData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating timesheet entry:", error);
      throw new Error(`Failed to update timesheet entry: ${error.message}`);
    }

    console.log("Timesheet entry updated successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in updateTimesheetEntry:", error);
    throw error;
  }
};

export const calculateTotalHours = (entries: TimesheetEntry[]): number => {
  return entries.reduce((sum, entry) => sum + entry.hours_logged, 0);
};

export const fetchProjectsWithTotalHours = async (): Promise<ProjectWithHours[]> => {
  console.log("Fetching projects with total hours...");

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*");

  if (projectsError) {
    console.error("Error fetching projects:", projectsError);
    throw new Error(`Failed to fetch projects: ${projectsError.message}`);
  }

  const projectsWithHours = await Promise.all(
    projects.map(async (project) => {
      const { data: timeEntries, error: timeEntriesError } = await supabase
        .from("timesheet_entries")
        .select("*")
        .eq("project_id", project.id);

      if (timeEntriesError) {
        console.error("Error fetching time entries:", timeEntriesError);
        return { ...project, total_hours: 0 }; // Return 0 if there's an error fetching time entries
      }

      const total_hours = calculateTotalHours(timeEntries);
      return { ...project, total_hours };
    })
  );

  console.log("Fetched projects with total hours:", projectsWithHours);
  return projectsWithHours;
};

export const getTimesheetReport = async (
  startDate: string,
  endDate: string,
  projectIds?: string[],
  contractIds?: string[],
  customerIds?: string[],
  userIds?: string[]
): Promise<any[]> => {
  console.log("Generating timesheet report with filters:", { startDate, endDate, projectIds, contractIds, customerIds, userIds });

  let query = supabase
    .from("timesheet_entries")
    .select(`
      *,
      project:projects (
        id,
        name,
        description,
        customer_id,
        customer:customers (
          id,
          name
        )
      ),
      contract:contracts (
        id,
        name,
        description,
        customer_id,
        customer:customers (
          id,
          name
        )
      ),
      user:users (
        id,
        name,
        email
      )
    `)
    .gte("entry_date", startDate)
    .lte("entry_date", endDate);

  if (projectIds && projectIds.length > 0) {
    query = query.in("project_id", projectIds);
  }

  if (contractIds && contractIds.length > 0) {
    query = query.in("contract_id", contractIds);
  }

  if (customerIds && customerIds.length > 0) {
    query = query.in("project.customer_id", customerIds).or(`contract.customer_id.in.(${customerIds.join(',')})`);
  }

  if (userIds && userIds.length > 0) {
    query = query.in("user_id", userIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error generating timesheet report:", error);
    throw new Error(`Failed to generate timesheet report: ${error.message}`);
  }

  console.log("Timesheet report data:", data);
  return data || [];
};
