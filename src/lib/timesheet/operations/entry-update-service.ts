
import { supabase } from "@/integrations/supabase/client";
import { TimesheetEntry, CreateTimesheetEntry } from "../types";
import { validateWeekendEntry } from "../validation/weekend-validation-service";

export const updateTimesheetEntry = async (entry: TimesheetEntry): Promise<TimesheetEntry> => {
  console.log(`Updating existing entry: ${entry.id}`);
  
  // For updates, re-validate weekend permissions as they might have changed
  const updateWeekendValidation = await validateWeekendEntry(entry.entry_date);
  if (!updateWeekendValidation.isValid) {
    console.error("Weekend validation failed on update:", updateWeekendValidation.message);
    throw new Error(updateWeekendValidation.message || "Weekend entry not allowed");
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

  // For admin editing: preserve the original user_id if it exists
  // This allows admins to update entries for other users
  if (entry.user_id) {
    (dbEntry as any).user_id = entry.user_id;
  }
  
  // Update existing entry - RLS will ensure user can only update their own entries or admin can update any
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
};
