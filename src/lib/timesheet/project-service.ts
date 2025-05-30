
import { supabase } from "@/integrations/supabase/client";
import { Project } from "./types";

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

export const fetchProjects = async (filters?: { searchTerm?: string; activeOnly?: boolean }): Promise<Project[]> => {
  try {
    console.log("Fetching projects with filters:", filters);
    
    let query = supabase
      .from("projects")
      .select("id, name, description, budget_hours, start_date, end_date, is_active, customer_id");

    // Apply active filter
    if (filters?.activeOnly) {
      query = query.eq("is_active", true);
    }

    // Apply search filter
    if (filters?.searchTerm) {
      query = query.ilike("name", `%${filters.searchTerm}%`);
    }

    const { data, error } = await query
      .order("is_active", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} projects`);
    
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
    console.error("Error in fetchProjects:", error);
    throw error;
  }
};

export const saveProject = async (projectData: Omit<Project, 'id' | 'hours_used'>): Promise<Project> => {
  try {
    console.log("Saving project:", projectData);
    
    const { data, error } = await supabase
      .from("projects")
      .insert([{
        name: projectData.name,
        description: projectData.description,
        budget_hours: projectData.budget_hours,
        start_date: projectData.start_date,
        end_date: projectData.end_date,
        customer_id: projectData.customer_id,
        is_active: projectData.is_active ?? true
      }])
      .select()
      .single();

    if (error) {
      console.error("Error saving project:", error);
      throw error;
    }

    console.log("Project saved successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in saveProject:", error);
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
    console.log(`Project ${projectId} has ${totalHours} hours used`);
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
