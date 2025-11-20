import { supabase } from "@/integrations/supabase/client";
import { TimesheetEntry, CreateTimesheetEntry } from "../types";
import { fetchWeeklyWorkSchedule } from "@/lib/weekly-work-schedule-service";
import { getDefaultWeeklySchedule } from "@/lib/work-schedule-service";

export const createTimesheetEntry = async (entry: TimesheetEntry): Promise<TimesheetEntry> => {
  // Server-side validation: Check if day is scheduled
  try {
    const entryDate = new Date(entry.entry_date);
    const weekStart = new Date(entryDate);
    weekStart.setDate(entryDate.getDate() - entryDate.getDay() + 1); // Monday
    
    // Fetch weekly schedule
    const weeklySchedule = await fetchWeeklyWorkSchedule(entry.user_id, weekStart);
    
    // Get the day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = entryDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const dayName = dayNames[dayOfWeek];
    
    // Check if this day has scheduled hours
    let scheduledHours = 0;
    if (weeklySchedule) {
      scheduledHours = weeklySchedule[`${dayName}_hours`] || 0;
    } else {
      // No weekly override, fetch employment type for default
      const { data: profile } = await supabase
        .from("profiles")
        .select("employment_type")
        .eq("id", entry.user_id)
        .single();
      
      const defaultSchedule = getDefaultWeeklySchedule(profile?.employment_type || 'full-time');
      scheduledHours = defaultSchedule[`${dayName}_hours`];
    }
    
    if (scheduledHours === 0) {
      throw new Error("Cannot create entry for unscheduled day. You are not scheduled to work on this day.");
    }
  } catch (validationError: any) {
    console.error("Schedule validation error:", validationError);
    throw validationError;
  }

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
