
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "../date-utils";
import { TimesheetEntry } from "./types";

export const fetchTimesheetEntries = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  includeUserData: boolean = false
): Promise<TimesheetEntry[]> => {
  try {
    console.log(`Fetching entries for user ${userId} from ${formatDate(startDate)} to ${formatDate(endDate)}`);
    
    // Get current authenticated user to validate access
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    // Security check: Only allow fetching for the current authenticated user
    if (userId !== currentUser.id) {
      throw new Error("Access denied: You can only access your own timesheet entries");
    }
    
    // Fetch entries with RLS automatically filtering by user_id = auth.uid()
    // No need to add .eq('user_id', userId) as RLS handles this
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

    if (!entriesData || entriesData.length === 0) {
      console.log("No entries found for the specified date range");
      return [];
    }

    console.log(`Fetched ${entriesData.length} entries`);
    
    // Fetch projects separately
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
    }, {} as Record<string, any>);

    let entriesWithProjects = entriesData.map(entry => ({
      ...entry,
      project: projectsMap[entry.project_id]
    }));

    // Since we're only showing current user's entries, we don't need to fetch other user data
    // Just add the current user's basic info if requested
    if (includeUserData && currentUser) {
      entriesWithProjects = entriesWithProjects.map(entry => ({
        ...entry,
        user: { id: currentUser.id, full_name: 'You' }
      }));
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
    
    // Get current authenticated user to validate access
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    // Security check: Ensure user can only save their own entries
    if (entry.user_id !== currentUser.id) {
      throw new Error("Access denied: You can only modify your own timesheet entries");
    }
    
    // Create a clean data object for the database operation
    const dbEntry = {
      user_id: currentUser.id, // Always use authenticated user's ID
      project_id: entry.project_id,
      entry_date: entry.entry_date,
      hours_logged: entry.hours_logged,
      notes: entry.notes,
      jira_task_id: entry.jira_task_id,
      start_time: entry.start_time || null,
      end_time: entry.end_time || null,
    };

    console.log("Database entry data:", dbEntry);
    
    if (entry.id) {
      // Update existing entry - RLS will ensure user can only update their own entries
      const { data, error } = await supabase
        .from("timesheet_entries")
        .update(dbEntry)
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
      // Create new entry - RLS will ensure user_id matches auth.uid()
      const { data, error } = await supabase
        .from("timesheet_entries")
        .insert(dbEntry)
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

export const duplicateTimesheetEntry = async (entryId: string): Promise<TimesheetEntry> => {
  try {
    console.log(`Duplicating entry ${entryId}`);
    
    // Get current authenticated user to validate access
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      throw new Error("Authentication required");
    }
    
    // First get the original entry - RLS will ensure we only get user's own entries
    const { data: originalEntry, error: fetchError } = await supabase
      .from("timesheet_entries")
      .select("*")
      .eq("id", entryId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching original entry:", fetchError);
      throw fetchError;
    }
    
    if (!originalEntry) {
      throw new Error("Original entry not found");
    }

    // Security check: Ensure the entry belongs to the current user
    if (originalEntry.user_id !== currentUser.id) {
      throw new Error("Access denied: You can only duplicate your own entries");
    }
    
    // Create a new entry with the same data but a new ID
    const newEntryData = {
      user_id: currentUser.id, // Always use authenticated user's ID
      project_id: originalEntry.project_id,
      entry_date: originalEntry.entry_date,
      hours_logged: originalEntry.hours_logged,
      notes: originalEntry.notes ? `${originalEntry.notes} (copy)` : "(copy)",
      jira_task_id: originalEntry.jira_task_id,
      start_time: originalEntry.start_time,
      end_time: originalEntry.end_time
    };
    
    console.log("Creating duplicate entry:", newEntryData);
    
    const { data: newEntry, error: insertError } = await supabase
      .from("timesheet_entries")
      .insert(newEntryData)
      .select();
      
    if (insertError) {
      console.error("Error creating duplicate entry:", insertError);
      throw insertError;
    }
    
    console.log("Duplicate entry created:", newEntry?.[0]);
    
    return newEntry?.[0] as TimesheetEntry;
  } catch (error) {
    console.error("Error in duplicateTimesheetEntry:", error);
    throw error;
  }
};

export const deleteTimesheetEntry = async (entryId: string): Promise<void> => {
  try {
    console.log(`Deleting entry ${entryId}`);
    
    // Get current authenticated user to validate access
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    // RLS will ensure user can only delete their own entries
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
    
    // Get current authenticated user to validate access
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    // Security check: Only allow deleting for the current authenticated user
    if (userId !== currentUser.id) {
      throw new Error("Access denied: You can only delete your own timesheet entries");
    }
    
    // First, get the count of entries that will be deleted - RLS will filter automatically
    const { count: entriesCount, error: countError } = await supabase
      .from("timesheet_entries")
      .select("id", { count: 'exact' });
    
    if (countError) {
      console.error("Error counting timesheet entries:", countError);
      throw countError;
    }
    
    // Then perform the deletion - RLS will ensure only user's own entries are deleted
    const { error: deleteError } = await supabase
      .from("timesheet_entries")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all entries (RLS will filter)

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
    console.log(`Fetching report data from ${formatDate(startDate)} to ${formatDate(endDate)} with filters:`, filters);
    
    // Get current authenticated user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      throw new Error("Authentication required");
    }

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

    // For regular users, RLS will automatically filter to their own data
    // For admin users who want to see all data, they would need special handling
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
