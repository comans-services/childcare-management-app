
import { supabase } from "@/integrations/supabase/client";
import { TimesheetEntry, CreateTimesheetEntry } from "../types";

export const createTimesheetEntry = async (entry: TimesheetEntry): Promise<TimesheetEntry> => {
  console.log("=== CREATE TIMESHEET ENTRY SERVICE DEBUG ===");
  console.log("Input entry:", entry);
  console.log("Entry user_id:", entry.user_id);
  
  // Get current authenticated user for admin validation
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("Authentication error during entry creation:", authError);
    throw new Error("Authentication required");
  }
  
  console.log("=== AUTHENTICATED USER ===");
  console.log("Current user ID:", user.id);
  console.log("Target user ID:", entry.user_id);
  console.log("Is admin editing other user:", entry.user_id !== user.id);
  
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

  // CRITICAL: Always include user_id - this is essential for admin editing
  if (entry.user_id) {
    (dbEntry as any).user_id = entry.user_id;
    console.log("=== CRITICAL DEBUG ===");
    console.log("Setting user_id in database entry:", entry.user_id);
    console.log("This should be the TARGET user, not the current admin user");
  } else {
    console.error("ERROR: No user_id provided in entry data - this will cause issues");
    throw new Error("User ID is required for timesheet entry creation");
  }

  console.log("=== FINAL DATABASE ENTRY ===");
  console.log("Database entry with user_id:", dbEntry);
  console.log("About to insert with user_id:", (dbEntry as any).user_id);
  
  // Create new entry - trigger will handle user_id validation and assignment
  const { data, error } = await supabase
    .from("timesheet_entries")
    .insert(dbEntry)
    .select();

  if (error) {
    console.error("=== DATABASE ERROR ===");
    console.error("Database error creating timesheet entry:", error);
    console.error("Entry data that failed:", dbEntry);
    throw error;
  }
  
  console.log("=== DATABASE SUCCESS ===");
  console.log("Entry created successfully in database:", data?.[0]);
  console.log("Created entry user_id:", data?.[0]?.user_id);
  console.log("Expected user_id:", entry.user_id);
  
  if (data?.[0]?.user_id !== entry.user_id) {
    console.error("=== CRITICAL ERROR ===");
    console.error("Database returned different user_id than expected!");
    console.error("Expected:", entry.user_id);
    console.error("Got:", data?.[0]?.user_id);
  }
  
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
