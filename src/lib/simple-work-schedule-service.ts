
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";

export interface WeeklyScheduleRow {
  id: string;
  user_id: string;
  week_start_date: string;
  monday_hours: number;
  tuesday_hours: number;
  wednesday_hours: number;
  thursday_hours: number;
  friday_hours: number;
  saturday_hours: number;
  sunday_hours: number;
  created_at: string;
  updated_at: string;
}

// Convert days count (0-5) to individual daily hours
const convertDaysToHours = (days: number) => {
  return {
    monday_hours: days >= 1 ? 8 : 0,
    tuesday_hours: days >= 2 ? 8 : 0,
    wednesday_hours: days >= 3 ? 8 : 0,
    thursday_hours: days >= 4 ? 8 : 0,
    friday_hours: days >= 5 ? 8 : 0,
    saturday_hours: 0,
    sunday_hours: 0,
  };
};

// Convert individual daily hours back to days count
const convertHoursToDays = (schedule: WeeklyScheduleRow): number => {
  const workingDays = [
    schedule.monday_hours > 0 ? 1 : 0,
    schedule.tuesday_hours > 0 ? 1 : 0,
    schedule.wednesday_hours > 0 ? 1 : 0,
    schedule.thursday_hours > 0 ? 1 : 0,
    schedule.friday_hours > 0 ? 1 : 0,
  ].reduce((sum, day) => sum + day, 0);
  
  return workingDays;
};

export const upsertWeeklySchedule = async (
  userId: string, 
  weekStart: string, 
  days: number
): Promise<WeeklyScheduleRow | null> => {
  try {
    const dailyHours = convertDaysToHours(days);
    console.log(`Upserting weekly schedule: ${userId}, week ${weekStart}, ${days} days`);
    
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    const { data, error } = await supabase
      .from("weekly_work_schedules")
      .upsert({
        user_id: userId,
        week_start_date: weekStart,
        updated_at: new Date().toISOString(),
        created_by: currentUser.id,
        ...dailyHours,
      }, {
        onConflict: "user_id,week_start_date"
      })
      .select()
      .single();

    if (error) {
      console.error("Error upserting weekly schedule:", error);
      throw error;
    }

    console.log(`Weekly schedule upserted successfully:`, data);
    return data;
  } catch (error) {
    console.error("Error in upsertWeeklySchedule:", error);
    throw error;
  }
};

export const deleteWeeklySchedule = async (userId: string, weekStart: string): Promise<void> => {
  try {
    console.log(`Deleting weekly schedule for user ${userId}, week ${weekStart}`);
    
    const { error } = await supabase
      .from("weekly_work_schedules")
      .delete()
      .eq("user_id", userId)
      .eq("week_start_date", weekStart);

    if (error) {
      console.error("Error deleting weekly schedule:", error);
      throw error;
    }

    console.log(`Weekly schedule deleted successfully`);
  } catch (error) {
    console.error("Error in deleteWeeklySchedule:", error);
    throw error;
  }
};

export const fetchWeeklySchedules = async (
  userIds: string[],
  rangeStart: string,
  rangeEnd: string
): Promise<Record<string, WeeklyScheduleRow[]>> => {
  try {
    console.log(`Fetching weekly schedules for users ${userIds.join(", ")}, range ${rangeStart} to ${rangeEnd}`);
    
    const { data, error } = await supabase
      .from("weekly_work_schedules")
      .select("*")
      .in("user_id", userIds)
      .gte("week_start_date", rangeStart)
      .lte("week_start_date", rangeEnd);

    if (error) {
      console.error("Error fetching weekly schedules:", error);
      throw error;
    }

    // Group by user_id
    const grouped: Record<string, WeeklyScheduleRow[]> = {};
    userIds.forEach(userId => {
      grouped[userId] = [];
    });

    data?.forEach(row => {
      if (!grouped[row.user_id]) {
        grouped[row.user_id] = [];
      }
      grouped[row.user_id].push(row);
    });

    console.log(`Fetched weekly schedules:`, grouped);
    return grouped;
  } catch (error) {
    console.error("Error in fetchWeeklySchedules:", error);
    return {};
  }
};

// Helper function to convert schedule row to days and hours
export const getEffectiveSchedule = (schedule: WeeklyScheduleRow | null) => {
  if (!schedule) {
    return { days: 0, hours: 0 };
  }
  
  const days = convertHoursToDays(schedule);
  const hours = days * 8;
  
  return { days, hours };
};
