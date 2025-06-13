
import { supabase } from "@/integrations/supabase/client";
import { logEntryEvent } from "../audit-service";

export const deleteTimesheetEntry = async (entryId: string): Promise<void> => {
  try {
    console.log(`=== DELETING ENTRY ${entryId} ===`);

    // Get current user for audit logging
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error during entry deletion:", authError);
      throw new Error("Authentication required");
    }

    // Get entry details before deletion for audit logging
    const { data: entryData, error: fetchError } = await supabase
      .from("timesheet_entries")
      .select("project_id, hours_logged, entry_date, notes")
      .eq("id", entryId)
      .single();

    if (fetchError) {
      console.error("Error fetching entry for deletion:", fetchError);
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

    // Log the deletion event if we have entry data
    if (entryData && user) {
      console.log("=== LOGGING DELETE AUDIT EVENT ===");
      await logEntryEvent(user.id, 'entry_deleted', entryId, {
        project_id: entryData.project_id,
        hours_logged: entryData.hours_logged,
        entry_date: entryData.entry_date,
        notes: entryData.notes
      });
    }
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
    
    // Log bulk deletion event
    const { data: { user } } = await supabase.auth.getUser();
    if (user && entriesCount && entriesCount > 0) {
      console.log("=== LOGGING BULK DELETE AUDIT EVENT ===");
      await logEntryEvent(user.id, 'entry_deleted', 'bulk-delete', {
        bulk_operation: true,
        entries_deleted: entriesCount
      });
    }
    
    return entriesCount || 0;
  } catch (error) {
    console.error("Error in deleteAllTimesheetEntries:", error);
    throw error;
  }
};
