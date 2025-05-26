
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "../date-utils";
import { TimesheetEntry } from "./types";

export const fetchTimesheetEntries = async (
  startDate: Date,
  endDate: Date,
  includeUserData: boolean = false
): Promise<TimesheetEntry[]> => {
  try {
    console.log(`=== FETCHING TIMESHEET ENTRIES ===`);
    console.log(`Date range: ${formatDate(startDate)} to ${formatDate(endDate)}`);
    console.log(`Include user data: ${includeUserData}`);
    
    // Get current user for defensive filtering
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No authenticated user found");
      return [];
    }
    
    // RLS will automatically filter by user_id = auth.uid(), but add defensive filter
    const { data: entriesData, error: entriesError } = await supabase
      .from("timesheet_entries")
      .select("*")
      .eq('user_id', user.id) // Defensive filter
      .gte("entry_date", formatDate(startDate))
      .lte("entry_date", formatDate(endDate))
      .order("entry_date", { ascending: true });

    if (entriesError) {
      console.error("Error fetching timesheet entries:", entriesError);
      throw entriesError;
    }

    console.log(`Filtered entries count: ${entriesData?.length || 0}`);
    
    if (!entriesData || entriesData.length === 0) {
      console.log("No entries found for the current user in the specified date range");
      return [];
    }

    // Fetch projects separately (only get unique project IDs)
    const projectIds = [...new Set(entriesData.map(entry => entry.project_id))];
    console.log(`Fetching ${projectIds.length} unique projects`);
    
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
    }, {} as Record<string, any>);

    // Map entries with their associated projects
    let entriesWithProjects = entriesData.map(entry => ({
      ...entry,
      project: projectsMap[entry.project_id]
    }));

    console.log(`Final entries count: ${entriesWithProjects.length}`);

    // Add current user info if requested
    if (includeUserData) {
      entriesWithProjects = entriesWithProjects.map(entry => ({
        ...entry,
        user: { id: user.id, full_name: 'You' }
      }));
    }

    return entriesWithProjects;
  } catch (error) {
    console.error("Error in fetchTimesheetEntries:", error);
    throw error;
  }
};

export const fetchReportData = async (
  startDate: Date,
  endDate: Date,
  filters: {
    userId?: string | null;
    projectId?: string | null;
    customerId?: string | null;
    contractId?: string | null;
  } = {}
): Promise<TimesheetEntry[]> => {
  try {
    console.log(`=== FETCHING REPORT DATA (ADMIN FUNCTION) ===`);
    console.log(`Date range: ${formatDate(startDate)} to ${formatDate(endDate)}`);
    console.log(`Filters:`, filters);

    // Get current user to check admin status
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("No authenticated user found");
      throw new Error("Authentication required");
    }

    // Check if user is admin by checking their role
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      throw new Error("Unable to verify user permissions");
    }

    const isAdmin = profileData?.role === 'admin';
    console.log(`User is admin: ${isAdmin}`);

    if (isAdmin) {
      // Use the admin RPC function for full access
      const { data: reportData, error } = await supabase.rpc('timesheet_entries_report', {
        p_start_date: startDate.toISOString().slice(0, 10),
        p_end_date: endDate.toISOString().slice(0, 10),
        p_user_id: filters.userId || null,
        p_project_id: filters.projectId || null,
        p_customer_id: filters.customerId || null
      });
      
      if (error) {
        console.error("Error calling admin reporting function:", error);
        throw error;
      }
      
      console.log(`Admin function returned ${reportData?.length || 0} entries`);
      
      // Transform the data to match the expected TimesheetEntry format
      const transformedData = reportData?.map((entry: any) => ({
        id: entry.id,
        user_id: entry.user_id,
        project_id: entry.project_id,
        entry_date: entry.entry_date,
        hours_logged: entry.hours_logged,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        notes: entry.notes,
        jira_task_id: entry.jira_task_id,
        start_time: entry.start_time,
        end_time: entry.end_time,
        // Add the joined data as nested objects
        project: {
          id: entry.project_id,
          name: entry.project_name,
          description: entry.project_description,
          customer_id: entry.project_customer_id
        },
        user: {
          id: entry.user_id,
          full_name: entry.user_full_name,
          email: entry.user_email,
          organization: entry.user_organization,
          time_zone: entry.user_time_zone
        }
      })) || [];
      
      return transformedData;
    } else {
      // Non-admin users can only see their own data
      console.log("Non-admin user, fetching own entries only");
      return await fetchTimesheetEntries(startDate, endDate, true);
    }
  } catch (error) {
    console.error("Error in fetchReportData:", error);
    throw error;
  }
};
