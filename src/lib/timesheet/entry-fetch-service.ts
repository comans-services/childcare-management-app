
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
    
    // RLS will automatically filter by user_id = auth.uid()
    const { data: entriesData, error: entriesError } = await supabase
      .from("timesheet_entries")
      .select("*")
      .gte("entry_date", formatDate(startDate))
      .lte("entry_date", formatDate(endDate))
      .order("entry_date", { ascending: true });

    if (entriesError) {
      console.error("Error fetching timesheet entries:", entriesError);
      throw entriesError;
    }

    console.log(`RLS filtered entries count: ${entriesData?.length || 0}`);
    
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        entriesWithProjects = entriesWithProjects.map(entry => ({
          ...entry,
          user: { id: user.id, full_name: 'You' }
        }));
      }
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
    console.log(`=== FETCHING REPORT DATA ===`);
    console.log(`Date range: ${formatDate(startDate)} to ${formatDate(endDate)}`);
    console.log(`Filters:`, filters);

    // Start with base query including joins for related data
    let query = supabase
      .from("timesheet_entries")
      .select(`
        *,
        projects!inner(id, name, description, customer_id, budget_hours, is_active),
        profiles!inner(id, full_name, email, organization, time_zone)
      `);

    // Apply date range filters (required)
    const startDateStr = startDate.toISOString().slice(0, 10);
    const endDateStr = endDate.toISOString().slice(0, 10);
    
    query = query
      .gte('entry_date', startDateStr)
      .lte('entry_date', endDateStr);

    // RLS will automatically filter to user's own data
    if (filters.projectId) {
      query = query.eq("project_id", filters.projectId);
    }

    if (filters.customerId) {
      query = query.eq("projects.customer_id", filters.customerId);
    }

    // Execute the query - RLS will automatically filter results
    const { data: entries, error } = await query.order("entry_date", { ascending: true });
    
    if (error) {
      console.error("Error fetching report data:", error);
      throw error;
    }
    
    console.log(`Fetched ${entries?.length || 0} entries for report`);
    
    // Transform the data to match the expected TimesheetEntry format
    const transformedData = entries?.map(entry => ({
      ...entry,
      project: entry.projects,
      user: entry.profiles
    })) || [];
    
    return transformedData;
  } catch (error) {
    console.error("Error in fetchReportData:", error);
    throw error;
  }
};
