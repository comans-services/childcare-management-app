
import { supabase } from "@/integrations/supabase/client";
import { TimesheetEntry, CreateTimesheetEntry } from "../types";

export const createTimesheetEntry = async (entry: TimesheetEntry): Promise<TimesheetEntry> => {
  console.log("Creating new entry - user_id will be handled by trigger with admin override logic");
  
  // Create a clean data object for the database operation
  const dbEntry: CreateTimesheetEntry = {
    entry_date: entry.entry_date,
    hours_logged: entry.hours_logged,
    start_time: entry.start_time || "",
    end_time: entry.end_time || "",
    user_id: entry.user_id, // Include user_id for admin editing - trigger handles validation
  };

  if (entry.user_id) {
    console.log("Admin editing: target user_id =", entry.user_id);
  }

  console.log("Database entry data:", dbEntry);
  
  // Create new entry - trigger will handle user_id assignment and validation
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
  const newEntry: TimesheetEntry = { 
    ...data?.[0], 
    entry_type: 'project' as const
  };
  if (entry.project) {
    newEntry.project = entry.project;
  }
  if (entry.contract) {
    newEntry.contract = entry.contract;
  }
  
  return newEntry;
};
