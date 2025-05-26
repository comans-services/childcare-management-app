
import { supabase } from "@/integrations/supabase/client";
import { Project } from "./types";

export const fetchUserProjects = async (): Promise<Project[]> => {
  try {
    console.log("Fetching projects...");
    
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error:", authError);
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, description, budget_hours, start_date, end_date, is_active, customer_id")
      .or("is_active.eq.true,is_active.is.null")
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

export const getProjectHoursUsed = async (projectId: string): Promise<number> => {
  try {
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return 0;
    }

    const { data, error } = await supabase
      .from("timesheet_entries")
      .select("hours_logged")
      .eq("project_id", projectId)
      .eq("user_id", user.id);
      
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
