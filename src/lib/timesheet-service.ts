
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
  hours_used?: number;  // New field to track hours used
  customer_id?: string; // New field to reference customer
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
  user?: {
    id: string;
    full_name?: string;
    email?: string;
    organization?: string;
    time_zone?: string;
  };
}

export const fetchUserProjects = async (): Promise<Project[]> => {
  try {
    console.log("Fetching projects...");
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, description, budget_hours, start_date, end_date, is_active, customer_id")
      .order("is_active", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} projects`);
    console.log("Projects data:", data);
    
    // Fetch hours used for each project
    const projectsWithHours = await Promise.all(
      (data || []).map(async (project) => {
        const hours = await getProjectHoursUsed(project.id);
        return {
          ...project,
          hours_used: hours
        };
      })
    );
    
    return projectsWithHours;
  } catch (error) {
    console.error("Error in fetchUserProjects:", error);
    throw error;
  }
};

export const fetchTimesheetEntries = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  includeUserData: boolean = false
): Promise<TimesheetEntry[]> => {
  try {
    console.log(`Fetching entries for user ${userId} from ${formatDate(startDate)} to ${formatDate(endDate)}`);
    
    // First, fetch the entries with a simpler query
    const { data: entriesData, error: entriesError } = await supabase
      .from("timesheet_entries")
      .select("*")
      .gte("entry_date", formatDate(startDate))
      .lte("entry_date", formatDate(endDate));

    if (entriesError) {
      console.error("Error fetching timesheet entries:", entriesError);
      throw entriesError;
    }

    if (!entriesData || entriesData.length === 0) {
      console.log("No entries found for the specified date range");
      return [];
    }

    console.log(`Fetched ${entriesData.length} entries`);
    
    // Then fetch the projects separately
    const projectIds = [...new Set(entriesData.map(entry => entry.project_id))];
    
    if (projectIds.length === 0) {
      console.log("No project IDs found in entries");
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

    console.log(`Fetched ${projectsData?.length || 0} projects for entries`);

    // Create a map of projects by ID for quick lookup
    const projectsMap = (projectsData || []).reduce((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {} as Record<string, Project>);

    let entriesWithProjects = entriesData.map(entry => ({
      ...entry,
      project: projectsMap[entry.project_id]
    }));

    // If user data is requested, fetch and add it to entries
    if (includeUserData) {
      const userIds = [...new Set(entriesData.map(entry => entry.user_id))];
      
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, full_name, email, organization, time_zone")
          .in("id", userIds);
          
        if (!usersError && usersData) {
          console.log(`Fetched ${usersData.length} users for entries`);
          
          // Create a map of users by ID for quick lookup
          const usersMap = usersData.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {} as Record<string, any>);
          
          // Add user data to entries
          entriesWithProjects = entriesWithProjects.map(entry => ({
            ...entry,
            user: usersMap[entry.user_id]
          }));
        } else {
          console.error("Error fetching users for entries:", usersError);
        }
      }
    }

    return entriesWithProjects;
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
        .select();

      if (error) {
        console.error("Error updating timesheet entry:", error);
        throw error;
      }
      
      console.log("Entry updated successfully:", data?.[0]);
      
      // Return entry with preserved project data
      const updatedEntry = data?.[0] as TimesheetEntry;
      if (entry.project) {
        updatedEntry.project = entry.project;
      }
      
      return updatedEntry;
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
      
      console.log("Entry created successfully:", data?.[0]);
      
      // Return entry with preserved project data
      const newEntry = data?.[0] as TimesheetEntry;
      if (entry.project) {
        newEntry.project = entry.project;
      }
      
      return newEntry;
    }
  } catch (error) {
    console.error("Error in saveTimesheetEntry:", error);
    throw error;
  }
};

export const deleteTimesheetEntry = async (entryId: string): Promise<void> => {
  try {
    console.log(`Deleting entry ${entryId}`);
    
    // Remove the .select("count") part that was causing the error
    const { error } = await supabase
      .from("timesheet_entries")
      .delete()
      .eq("id", entryId);

    if (error) {
      console.error("Error deleting timesheet entry:", error);
      throw error;
    }
    
    console.log(`Entry ${entryId} deleted successfully.`);
  } catch (error) {
    console.error("Error in deleteTimesheetEntry:", error);
    throw error;
  }
};

export const deleteAllTimesheetEntries = async (userId: string): Promise<number> => {
  try {
    console.log(`Deleting all timesheet entries for user ${userId}`);
    
    // First, get the count of entries that will be deleted
    const { count: entriesCount, error: countError } = await supabase
      .from("timesheet_entries")
      .select("id", { count: 'exact' })
      .eq("user_id", userId);
    
    if (countError) {
      console.error("Error counting timesheet entries:", countError);
      throw countError;
    }
    
    // Then perform the deletion without using RETURNING
    const { error: deleteError } = await supabase
      .from("timesheet_entries")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting all timesheet entries:", deleteError);
      throw deleteError;
    }
    
    console.log(`All timesheet entries deleted successfully. Rows affected: ${entriesCount}`);
    return entriesCount || 0;
  } catch (error) {
    console.error("Error in deleteAllTimesheetEntries:", error);
    throw error;
  }
};

export const getProjectHoursUsed = async (projectId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("timesheet_entries")
      .select("hours_logged")
      .eq("project_id", projectId);
      
    if (error) {
      console.error("Error fetching project hours:", error);
      return 0;
    }
    
    // Sum up all hours logged for the project
    const totalHours = data?.reduce((sum, entry) => sum + entry.hours_logged, 0) || 0;
    return totalHours;
  } catch (error) {
    console.error("Error in getProjectHoursUsed:", error);
    return 0;
  }
};

export const updateProjectStatus = async (projectId: string, isActive: boolean): Promise<void> => {
  try {
    console.log(`Updating project ${projectId} status to ${isActive ? 'active' : 'inactive'}`);
    
    const { error } = await supabase
      .from("projects")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", projectId);

    if (error) {
      console.error("Error updating project status:", error);
      throw error;
    }
    
    console.log(`Project ${projectId} status updated successfully`);
  } catch (error) {
    console.error("Error in updateProjectStatus:", error);
    throw error;
  }
};
