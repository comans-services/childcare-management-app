
import { supabase } from "@/integrations/supabase/client";
import { TimesheetEntry, CreateTimesheetEntry } from "../types";

export const createTimesheetEntry = async (entry: TimesheetEntry): Promise<TimesheetEntry> => {
  console.log("Creating new entry (user_id and user_full_name will be auto-assigned by trigger)");
  
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

  // For admin editing: if entry has a specific user_id, include it
  // The trigger will handle validation and name assignment
  if (entry.user_id) {
    (dbEntry as any).user_id = entry.user_id;
  }

  console.log("Database entry data:", dbEntry);
  
  // Create new entry - trigger will automatically set user_id and user_full_name
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
};
