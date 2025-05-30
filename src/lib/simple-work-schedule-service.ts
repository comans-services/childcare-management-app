
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";

export interface WeeklyScheduleRow {
  id: string;
  user_id: string;
  week_start: string;
  days_per_week: number;
  target_hours: number;
  created_at: string;
  updated_at: string;
}

export const upsertWeeklySchedule = async (
  userId: string, 
  weekStart: string, 
  days: number
): Promise<WeeklyScheduleRow | null> => {
  try {
    const targetHours = days * 8;
    console.log(`Upserting weekly schedule: ${userId}, week ${weekStart}, ${days} days, ${targetHours} hours`);
    
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    const { data, error } = await supabase
      .from("weekly_work_schedules")
      .upsert({
        user_id: userId,
        week_start: weekStart,
        days_per_week: days,
        target_hours: targetHours,
        updated_at: new Date().toISOString(),
        // Set all daily hours based on days count (0-5 working days)
        monday_hours: days >= 1 ? 8 : 0,
        tuesday_hours: days >= 2 ? 8 : 0,
        wednesday_hours: days >= 3 ? 8 : 0,
        thursday_hours: days >= 4 ? 8 : 0,
        friday_hours: days >= 5 ? 8 : 0,
        saturday_hours: 0,
        sunday_hours: 0,
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
