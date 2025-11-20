import { supabase } from "@/integrations/supabase/client";
import { TimesheetEntry, CreateTimesheetEntry } from "../types";

export const createTimesheetEntry = async (entry: TimesheetEntry): Promise<TimesheetEntry> => {
  const dbEntry: CreateTimesheetEntry = {
    entry_date: entry.entry_date,
    hours_logged: entry.hours_logged,
    start_time: entry.start_time || "",
    end_time: entry.end_time || "",
    user_id: entry.user_id,
  };

  const { data, error } = await supabase
    .from("timesheet_entries")
    .insert([dbEntry])
    .select()
    .single();

  if (error) {
    console.error("Error creating timesheet entry:", error);
    throw error;
  }
  
  return data;
};
