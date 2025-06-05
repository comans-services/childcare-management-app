
import { supabase } from "@/integrations/supabase/client";
import { TimesheetEntry, CreateTimesheetEntry, UpdateTimesheetEntry } from "./types";
import { fetchWorkSchedule } from "@/lib/work-schedule-service";
import { isWeekend } from "@/lib/date-utils";
import { isAdmin } from "@/utils/roles";

// Helper function to validate weekend entry permissions
const validateWeekendEntryPermission = async (entryDate: string, userId?: string): Promise<void> => {
  const date = new Date(entryDate);
  
  console.log(`=== WEEKEND VALIDATION ===`);
  console.log(`Entry date: ${entryDate}`);
  console.log(`Is weekend: ${isWeekend(date)}`);
  
  // If not a weekend, allow the entry
  if (!isWeekend(date)) {
    console.log("Not a weekend - allowing entry");
    return;
  }
  
  // Get current user for admin check
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("Authentication error:", userError);
    throw new Error("Authentication required");
  }
  
  console.log(`Current user: ${user.id}`);
  
  // Check if current user is admin - admins can always add weekend entries
  const isUserAdmin = await isAdmin(user);
  console.log(`Is admin: ${isUserAdmin}`);
  
  if (isUserAdmin) {
    console.log("Admin user - allowing weekend entry");
    return;
  }
  
  // For non-admin users, check the target user's work schedule
  const targetUserId = userId || user.id;
  console.log(`Target user ID: ${targetUserId}`);
  
  const workSchedule = await fetchWorkSchedule(targetUserId);
  console.log(`Work schedule:`, workSchedule);
  console.log(`Allow weekend entries: ${workSchedule?.allow_weekend_entries}`);
  
  // If user doesn't have weekend permission, block the entry
  if (!workSchedule?.allow_weekend_entries) {
    console.log("Weekend entries not allowed - blocking entry");
    throw new Error("Weekend time entries require admin approval. Contact your administrator to enable weekend entries for your account.");
  }
  
  console.log("User has weekend permission - allowing weekend entry");
};

export const saveTimesheetEntry = async (entry: TimesheetEntry): Promise<TimesheetEntry> => {
  try {
    console.log("=== SAVING TIMESHEET ENTRY ===");
    console.log("Entry data:", entry);
    
    // Validate weekend entry permissions before proceeding (for both new and existing entries)
    await validateWeekendEntryPermission(entry.entry_date, entry.user_id);
    
    // Validate entry type and corresponding ID
    if (entry.entry_type === 'project' && !entry.project_id) {
      throw new Error("Project ID is required for project entries");
    }
    if (entry.entry_type === 'contract' && !entry.contract_id) {
      throw new Error("Contract ID is required for contract entries");
    }
    
    // Create a clean data object for the database operation
    const dbEntry: CreateTimesheetEntry = {
      entry_type: entry.entry_type,
      project_id: entry.project_id || null,
      contract_id: entry.contract_id || null,
      entry_date: entry.entry_date,
      hours_logged: entry.hours_logged,
      notes: entry.notes || "",
      jira_task_id: entry.jira_task_id || "",
      start_time: entry.start_time || "",
      end_time: entry.end_time || "",
    };

    console.log("Database entry data (user_id will be auto-assigned by trigger):", dbEntry);
    
    if (entry.id) {
      console.log(`Updating existing entry: ${entry.id}`);
      
      // Additional validation check for updates - re-validate weekend permissions
      console.log("Re-validating weekend permissions for update operation");
      await validateWeekendEntryPermission(entry.entry_date, entry.user_id);
      
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
      
      // Return entry with preserved related data
      const updatedEntry = data?.[0] as TimesheetEntry;
      if (entry.project) {
        updatedEntry.project = entry.project;
      }
      if (entry.contract) {
        updatedEntry.contract = entry.contract;
      }
      
      return updatedEntry;
    } else {
      console.log("Creating new entry (user_id will be auto-assigned by trigger)");
      
      // Create new entry - trigger will automatically set user_id to auth.uid()
      const { data, error } = await supabase
        .from("timesheet_entries")
        .insert(dbEntry)
        .select();

      if (error) {
        console.error("Error creating timesheet entry:", error);
        throw error;
      }
      
      console.log("Entry created successfully:", data?.[0]);
      
      // Return entry with preserved related data
      const newEntry = data?.[0] as TimesheetEntry;
      if (entry.project) {
        newEntry.project = entry.project;
      }
      if (entry.contract) {
        newEntry.contract = entry.contract;
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
      throw new Error("Original entry not found or access denied");
    }
    
    // Validate weekend entry permissions for the duplicate
    console.log("Validating weekend permissions for duplicate entry");
    await validateWeekendEntryPermission(originalEntry.entry_date);
    
    // Create a new entry with the same data but no user_id (trigger will set it)
    const newEntryData = {
      entry_type: originalEntry.entry_type,
      project_id: originalEntry.project_id,
      contract_id: originalEntry.contract_id,
      entry_date: originalEntry.entry_date,
      hours_logged: originalEntry.hours_logged,
      notes: originalEntry.notes ? `${originalEntry.notes} (copy)` : "(copy)",
      jira_task_id: originalEntry.jira_task_id,
      start_time: originalEntry.start_time,
      end_time: originalEntry.end_time
    };
    
    console.log("Creating duplicate entry (user_id will be auto-assigned by trigger):", newEntryData);
    
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

export const deleteAllTimesheetEntries = async (): Promise<number> => {
  try {
    console.log(`Deleting all timesheet entries for authenticated user`);
    
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
