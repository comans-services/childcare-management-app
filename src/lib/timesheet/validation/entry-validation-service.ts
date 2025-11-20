import { supabase } from "@/integrations/supabase/client";
import { TimesheetEntry } from "../types";
import { getWeekStart } from "@/lib/date-utils";

export const validateEntryData = (entry: TimesheetEntry): void => {
  console.log("=== VALIDATING TIMESHEET ENTRY ===");
  console.log("Entry data:", entry);
  
  // Basic validation only
  if (!entry.entry_date) {
    throw new Error("Entry date is required");
  }
  if (!entry.hours_logged || entry.hours_logged <= 0) {
    throw new Error("Hours logged must be greater than 0");
  }
  if (!entry.start_time || !entry.end_time) {
    throw new Error("Start and end times are required");
  }
};

export const validateScheduledHours = async (
  userId: string,
  entryDate: string
): Promise<void> => {
  const date = new Date(entryDate);
  const weekStart = getWeekStart(date);
  const weekStartStr = weekStart.toISOString().split('T')[0];
  
  // Fetch weekly schedule
  const { data: schedule, error } = await supabase
    .from("weekly_work_schedules")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start_date", weekStartStr)
    .maybeSingle();

  if (error) {
    console.error("Error fetching schedule:", error);
    return; // Allow if we can't fetch schedule
  }

  // If no weekly schedule exists, allow (fall back to global schedule)
  if (!schedule) {
    return;
  }

  // Get day of week (0=Sun, 1=Mon, etc.)
  const dayOfWeek = date.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayKey = `${dayNames[dayOfWeek]}_hours` as keyof typeof schedule;
  
  const scheduledHours = Number(schedule[dayKey]) || 0;
  
  if (scheduledHours === 0) {
    const dayName = dayNames[dayOfWeek];
    throw new Error(`You are not scheduled to work on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`);
  }
};
