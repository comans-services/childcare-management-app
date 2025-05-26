import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "../date-utils";
import { TimesheetEntry } from "./types";

export const getUserRole = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  
  if (error) {
    console.error("getUserRole error", error);
    return null;
  }
  return data?.role ?? null;
};

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
    console.log(`=== FETCHING REPORT DATA (FIXED ADMIN FUNCTION) ===`);
    console.log(`Date range: ${formatDate(startDate)} to ${formatDate(endDate)}`);
    console.log(`Filters:`, filters);

    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (!sessionUser) throw new Error("Not authenticated");

    const isAdmin = await getUserRole(sessionUser.id) === "admin";
    console.log(`User is admin: ${isAdmin}`);

    let query = supabase
      .from("timesheet_entries")
      .select(`
        *,
        project:projects(id, name, description, customer_id),
        user:profiles(id, full_name, email, organization, time_zone)
      `)
      .gte("entry_date", startDate.toISOString().slice(0, 10))
      .lte("entry_date", endDate.toISOString().slice(0, 10));

    // USER SCOPING - This is the key fix
    if (filters.userId) {
      // Explicit employee filter chosen in UI
      console.log(`Filtering by specific user: ${filters.userId}`);
      query = query.eq("user_id", filters.userId);
    } else if (!isAdmin) {
      // Normal employee: force own rows
      console.log(`Non-admin user, filtering to own data: ${sessionUser.id}`);
      query = query.eq("user_id", sessionUser.id);
      // (Admins skip this to see everyone)
    } else {
      console.log(`Admin user, showing all entries`);
    }

    if (filters.projectId) {
      console.log(`Filtering by project: ${filters.projectId}`);
      query = query.eq("project_id", filters.projectId);
    }
    if (filters.customerId) {
      console.log(`Filtering by customer: ${filters.customerId}`);
      query = query.eq("customer_id", filters.customerId);
    }
    if (filters.contractId) {
      console.log(`Filtering by contract: ${filters.contractId}`);
      query = query.eq("contract_id", filters.contractId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error("Error in direct query:", error);
      throw error;
    }
    
    console.log(`Direct query returned ${data?.length || 0} entries`);
    
    // Transform the data to match the expected TimesheetEntry format
    const transformedData = data?.map((entry: any) => ({
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
      project: entry.project,
      user: entry.user
    })) || [];
    
    return transformedData;
  } catch (error) {
    console.error("Error in fetchReportData:", error);
    throw error;
  }
};
