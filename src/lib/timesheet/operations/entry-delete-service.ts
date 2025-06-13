
import { supabase } from "@/integrations/supabase/client";
import { logTimesheetEntryDeleted } from "@/lib/audit/audit-service";

export const deleteTimesheetEntry = async (entryId: string): Promise<void> => {
  try {
    console.log(`Deleting entry ${entryId}`);

    // First, fetch the entry details for audit logging
    const { data: entryData } = await supabase
      .from("timesheet_entries")
      .select(`
        *,
        project:projects(name),
        contract:contracts(name)
      `)
      .eq("id", entryId)
      .single();

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

    // Log the audit event
    if (entryData) {
      try {
        const projectName = entryData.project?.name || entryData.contract?.name || 'Unknown Project/Contract';
        await logTimesheetEntryDeleted(
          entryData.user_id,
          entryData.id,
          projectName,
          Number(entryData.hours_logged),
          entryData.entry_date
        );
      } catch (auditError) {
        console.error("Error logging audit event:", auditError);
        // Don't throw - audit logging shouldn't break the main operation
      }
    }
  } catch (error) {
    console.error("Error in deleteTimesheetEntry:", error);
    throw error;
  }
};

export const deleteAllTimesheetEntries = async (): Promise<number> => {
  try {
    console.log(`Deleting all timesheet entries for authenticated user`);
    
    // First, get the entries that will be deleted for audit logging
    const { data: entriesToDelete } = await supabase
      .from("timesheet_entries")
      .select(`
        id, user_id, hours_logged, entry_date,
        project:projects(name),
        contract:contracts(name)
      `);
    
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
    
    // Log audit events for bulk deletion
    if (entriesToDelete && entriesToDelete.length > 0) {
      try {
        const firstEntry = entriesToDelete[0];
        await logTimesheetEntryDeleted(
          firstEntry.user_id,
          'bulk-delete',
          'All Entries',
          entriesToDelete.reduce((sum, entry) => sum + Number(entry.hours_logged), 0),
          new Date().toISOString().split('T')[0]
        );
      } catch (auditError) {
        console.error("Error logging bulk delete audit event:", auditError);
        // Don't throw - audit logging shouldn't break the main operation
      }
    }
    
    return entriesCount || 0;
  } catch (error) {
    console.error("Error in deleteAllTimesheetEntries:", error);
    throw error;
  }
};
