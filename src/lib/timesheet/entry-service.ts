
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "../date-utils";
import { TimesheetEntry } from "./types";

export const fetchTimesheetEntries = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  includeUserData: boolean = true
): Promise<TimesheetEntry[]> => {
  try {
    console.log(`Fetching entries for user ${userId} from ${formatDate(startDate)} to ${formatDate(endDate)}`);
    
    // Fetch entries with a simple query - RLS will handle filtering
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

    // Fetch user data if requested
    if (includeUserData) {
      const userIds = [...new Set(entriesData.map(entry => entry.user_id))];
      
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, full_name, email, organization, time_zone")
          .in("id", userIds);
          
        if (!usersError && usersData && usersData.length > 0) {
          console.log(`Fetched ${usersData.length} users for entries`);
          
          // Create a map of users by ID for quick lookup
          const usersMap = usersData.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
          }, {} as Record<string, any>);
          
          // Add user data to entries
          entriesWithProjects = entriesWithProjects.map(entry => ({
            ...entry,
            user: usersMap[entry.user_id] || { id: entry.user_id }
          }));
          
          console.log("Entries with user data:", entriesWithProjects);
        } else {
          console.error("Error fetching users for entries:", usersError);
          console.log("Available user IDs:", userIds);
          
          // Add basic user data even if fetch failed
          entriesWithProjects = entriesWithProjects.map(entry => ({
            ...entry,
            user: { id: entry.user_id }
          }));
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
    
    // Create a clean data object for the database operation
    const dbEntry = {
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
      // Update existing entry
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
      
      // Return entry with preserved project and user data
      const updatedEntry = data?.[0] as TimesheetEntry;
      if (entry.project) {
        updatedEntry.project = entry.project;
      }
      
      // Preserve user data from the original entry
      if (entry.user) {
        updatedEntry.user = entry.user;
      }
      
      return updatedEntry;
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from("timesheet_entries")
        .insert({
          ...dbEntry,
          user_id: entry.user_id
        })
        .select();

      if (error) {
        console.error("Error creating timesheet entry:", error);
        throw error;
      }
      
      console.log("Entry created successfully:", data?.[0]);
      
      // Return entry with preserved project and user data
      const newEntry = data?.[0] as TimesheetEntry;
      if (entry.project) {
        newEntry.project = entry.project;
      }
      
      // Preserve user data from the original entry
      if (entry.user) {
        newEntry.user = entry.user;
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
    
    // First get the original entry
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
    
    // Create a new entry with the same data but a new ID
    const newEntryData = {
      user_id: originalEntry.user_id,
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
