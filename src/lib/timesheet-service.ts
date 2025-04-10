
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "./date-utils";

export interface Project {
  id: string;
  name: string;
  description?: string;
  budget_hours: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface TimesheetEntry {
  id?: string;
  project_id: string;
  user_id: string;
  entry_date: string;
  hours_logged: number;
  notes?: string;
  jira_task_id?: string;
  project?: Project;
}

export const fetchUserProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, description, budget_hours, start_date, end_date, is_active")
      .order("is_active", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchUserProjects:", error);
    throw error;
  }
};

export const fetchTimesheetEntries = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<TimesheetEntry[]> => {
  try {
    console.log(`Fetching entries for user ${userId} from ${formatDate(startDate)} to ${formatDate(endDate)}`);
    
    // First, fetch the entries - use simpler query to avoid potential RLS issues
    const { data: entriesData, error: entriesError } = await supabase
      .from("timesheet_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("entry_date", formatDate(startDate))
      .lte("entry_date", formatDate(endDate));

    if (entriesError) {
      console.error("Error fetching timesheet entries:", entriesError);
      throw entriesError;
    }

    if (!entriesData || entriesData.length === 0) {
      return [];
    }

    // Then fetch the projects separately
    const projectIds = [...new Set(entriesData.map(entry => entry.project_id))];
    
    if (projectIds.length === 0) {
      // Return entries without project details if no projects are found
      return entriesData;
    }
    
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("id, name, description, budget_hours, is_active")
      .in("id", projectIds);

    if (projectsError) {
      console.error("Error fetching projects for entries:", projectsError);
      // Return entries without project details rather than failing completely
      return entriesData;
    }

    // Create a map of projects by ID for quick lookup
    const projectsMap = (projectsData || []).reduce((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {} as Record<string, Project>);

    // Combine the entries with their respective projects
    return entriesData.map(entry => ({
      ...entry,
      project: projectsMap[entry.project_id]
    }));
  } catch (error) {
    console.error("Error in fetchTimesheetEntries:", error);
    throw error;
  }
};

export const saveTimesheetEntry = async (entry: TimesheetEntry): Promise<TimesheetEntry> => {
  try {
    console.log("Saving timesheet entry:", entry);
    
    if (entry.id) {
      // Update existing entry
      const { data, error } = await supabase
        .from("timesheet_entries")
        .update({
          project_id: entry.project_id,
          entry_date: entry.entry_date,
          hours_logged: entry.hours_logged,
          notes: entry.notes,
          jira_task_id: entry.jira_task_id
        })
        .eq("id", entry.id)
        .eq("user_id", entry.user_id)
        .select();

      if (error) {
        console.error("Error updating timesheet entry:", error);
        throw error;
      }
      
      return data?.[0] as TimesheetEntry;
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from("timesheet_entries")
        .insert({
          project_id: entry.project_id,
          user_id: entry.user_id,
          entry_date: entry.entry_date,
          hours_logged: entry.hours_logged,
          notes: entry.notes,
          jira_task_id: entry.jira_task_id
        })
        .select();

      if (error) {
        console.error("Error creating timesheet entry:", error);
        throw error;
      }
      
      return data?.[0] as TimesheetEntry;
    }
  } catch (error) {
    console.error("Error in saveTimesheetEntry:", error);
    throw error;
  }
};

export const deleteTimesheetEntry = async (entryId: string, userId: string): Promise<void> => {
  try {
    console.log(`Deleting entry ${entryId} for user ${userId}`);
    
    const { error } = await supabase
      .from("timesheet_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting timesheet entry:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteTimesheetEntry:", error);
    throw error;
  }
};
