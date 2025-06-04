
import { supabase } from "@/integrations/supabase/client";
import { Project } from "./types";
import { ProjectWithAssignees } from "./assignment-types";

export const fetchUserProjects = async (): Promise<Project[]> => {
  try {
    console.log("Fetching projects for current user...");
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // For regular users, only fetch projects they're assigned to
    // For admins, fetch all projects
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    let query = supabase
      .from("projects")
      .select("id, name, description, budget_hours, start_date, end_date, is_active, customer_id");

    if (profile?.role !== 'admin') {
      // First, get the project IDs the user is assigned to
      const { data: assignments } = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', user.id);

      const projectIds = assignments?.map(a => a.project_id) || [];
      
      // If user has no assignments, return empty array
      if (projectIds.length === 0) {
        console.log("User has no project assignments");
        return [];
      }

      // Filter projects by the assigned project IDs
      query = query.in('id', projectIds);
    }

    const { data, error } = await query
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

export const fetchProjectsWithAssignees = async (filters?: { searchTerm?: string; activeOnly?: boolean }): Promise<ProjectWithAssignees[]> => {
  try {
    console.log("Fetching projects with assignees, filters:", filters);
    
    // First, fetch projects with basic filters
    let projectQuery = supabase
      .from("projects")
      .select("id, name, description, budget_hours, start_date, end_date, is_active, customer_id");

    // Apply active filter
    if (filters?.activeOnly) {
      projectQuery = projectQuery.eq("is_active", true);
    }

    // Apply search filter
    if (filters?.searchTerm) {
      projectQuery = projectQuery.ilike("name", `%${filters.searchTerm}%`);
    }

    const { data: projects, error: projectsError } = await projectQuery
      .order("is_active", { ascending: false })
      .order("name", { ascending: true });

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
      throw projectsError;
    }

    console.log(`Fetched ${projects?.length || 0} projects`);
    
    // Now fetch assignments and profiles separately
    const { data: assignments, error: assignmentsError } = await supabase
      .from("project_assignments")
      .select(`
        project_id,
        user_id,
        profiles!inner(id, full_name, email)
      `);

    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError);
      // Don't throw error, just continue with empty assignments
    }

    // Transform the data to include assignees properly
    const projectsWithAssignees = await Promise.all(
      (projects || []).map(async (project: any) => {
        const hours = await getProjectHoursUsed(project.id);
        
        // Find assignees for this project
        const projectAssignments = assignments?.filter(a => a.project_id === project.id) || [];
        const assignees = projectAssignments.map(assignment => assignment.profiles).filter(Boolean);

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          budget_hours: project.budget_hours,
          start_date: project.start_date,
          end_date: project.end_date,
          is_active: project.is_active,
          customer_id: project.customer_id,
          hours_used: hours,
          assignees: assignees
        };
      })
    );
    
    return projectsWithAssignees;
  } catch (error) {
    console.error("Error in fetchProjectsWithAssignees:", error);
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
