import { supabase } from "@/integrations/supabase/client";
import { TimesheetEntry } from "../types";
import { isAdmin } from "@/utils/roles";

export const duplicateTimesheetEntry = async (entryId: string): Promise<TimesheetEntry> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Authentication required");

  const userIsAdmin = await isAdmin(user);
  
  const { data: originalEntry, error: fetchError } = await supabase
    .from("timesheet_entries")
    .select("*")
    .eq("id", entryId)
    .single();
    
  if (fetchError) throw fetchError;
  if (!originalEntry) throw new Error("Original entry not found");
  
  const newEntryData = {
    entry_date: originalEntry.entry_date,
    hours_logged: originalEntry.hours_logged,
    start_time: originalEntry.start_time,
    end_time: originalEntry.end_time,
    user_id: (userIsAdmin && originalEntry.user_id !== user.id) ? originalEntry.user_id : user.id
  };
  
  const { data: newEntry, error: insertError } = await supabase
    .from("timesheet_entries")
    .insert([newEntryData])
    .select()
    .single();
    
  if (insertError) throw insertError;
  
  // Database trigger will log the creation automatically
  
  return { ...newEntry, entry_type: 'project' as const } as TimesheetEntry;
};
