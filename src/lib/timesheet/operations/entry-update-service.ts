
import { supabase } from "@/integrations/supabase/client";
import { TimesheetEntry } from "../types";

export const updateTimesheetEntry = async (entry: TimesheetEntry): Promise<TimesheetEntry> => {
  if (!entry.id) {
    throw new Error("Entry ID is required for update");
  }

  console.log("Updating entry:", entry.id, "for user:", entry.user_id);

  // Create update object - only actual database fields
  const updateData = {
    entry_date: entry.entry_date,
    hours_logged: entry.hours_logged,
    start_time: entry.start_time,
    end_time: entry.end_time,
    user_id: entry.user_id // Include user_id for admin editing
  };

  console.log("Update data:", updateData);

  const { data, error } = await supabase
    .from("timesheet_entries")
    .update(updateData)
    .eq("id", entry.id)
    .select();

  if (error) {
    console.error("Error updating timesheet entry:", error);
    throw error;
  }

  console.log("Entry updated successfully:", data?.[0]);

  // Database trigger will log this automatically

  return data?.[0] as TimesheetEntry;
};
