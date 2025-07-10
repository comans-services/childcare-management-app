
import { supabase } from "@/integrations/supabase/client";
import { TimesheetEntry, CreateTimesheetEntry } from "../types";

export const createTimesheetEntry = async (entry: TimesheetEntry): Promise<TimesheetEntry> => {
  console.log("=== CREATE TIMESHEET ENTRY SERVICE DEBUG ===");
  console.log("Input entry:", entry);
  console.log("Entry user_id:", entry.user_id);
  
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

  // CRITICAL: Always include user_id for admin editing
  // The trigger will validate admin permissions and either preserve or override this value
  if (entry.user_id) {
    (dbEntry as any).user_id = entry.user_id;
    console.log("=== CRITICAL DEBUG ===");
    console.log("Setting user_id in database entry:", entry.user_id);
    console.log("Database entry with user_id:", dbEntry);
  } else {
    console.warn("WARNING: No user_id provided in entry data");
  }

  console.log("Final database entry data:", dbEntry);
  
  // Create new entry - trigger will handle user_id assignment and validation
  const { data, error } = await supabase
    .from("timesheet_entries")
    .insert(dbEntry)
    .select();

  if (error) {
    console.error("Database error creating timesheet entry:", error);
    throw error;
  }
  
  console.log("Entry created successfully in database:", data?.[0]);
  console.log("Created entry user_id:", data?.[0]?.user_id);
  
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
