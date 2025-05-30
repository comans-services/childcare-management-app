
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";

export interface WeeklyWorkSchedule {
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
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const fetchWeeklyWorkSchedule = async (userId: string, weekStartDate: Date): Promise<WeeklyWorkSchedule | null> => {
  try {
    const formattedDate = formatDate(weekStartDate);
    console.log(`Fetching weekly work schedule for user ${userId}, week ${formattedDate}`);
    
    const { data, error } = await supabase
      .from("weekly_work_schedules")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start_date", formattedDate)
      .maybeSingle();

    if (error) {
      console.error("Error fetching weekly work schedule:", error);
      return null;
    }

    console.log(`Weekly work schedule fetched:`, data);
    return data;
  } catch (error) {
    console.error("Error in fetchWeeklyWorkSchedule:", error);
    return null;
  }
};

export const upsertWeeklyWorkSchedule = async (
  userId: string, 
  weekStartDate: Date, 
  scheduleData: Partial<WeeklyWorkSchedule>
): Promise<WeeklyWorkSchedule | null> => {
  try {
    const formattedDate = formatDate(weekStartDate);
    console.log(`Upserting weekly work schedule for user ${userId}, week ${formattedDate}:`, scheduleData);
    
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    const { data, error } = await supabase
      .from("weekly_work_schedules")
      .upsert({
        user_id: userId,
        week_start_date: formattedDate,
        created_by: currentUser.id,
        updated_at: new Date().toISOString(),
        ...scheduleData
      }, {
        onConflict: "user_id,week_start_date"
      })
      .select()
      .single();

    if (error) {
      console.error("Error upserting weekly work schedule:", error);
      throw error;
    }

    console.log(`Weekly work schedule upserted successfully:`, data);
    return data;
  } catch (error) {
    console.error("Error in upsertWeeklyWorkSchedule:", error);
    throw error;
  }
};

export const deleteWeeklyWorkSchedule = async (userId: string, weekStartDate: Date): Promise<void> => {
  try {
    const formattedDate = formatDate(weekStartDate);
    console.log(`Deleting weekly work schedule for user ${userId}, week ${formattedDate}`);
    
    const { error } = await supabase
      .from("weekly_work_schedules")
      .delete()
      .eq("user_id", userId)
      .eq("week_start_date", formattedDate);

    if (error) {
      console.error("Error deleting weekly work schedule:", error);
      throw error;
    }

    console.log(`Weekly work schedule deleted successfully`);
  } catch (error) {
    console.error("Error in deleteWeeklyWorkSchedule:", error);
    throw error;
  }
};
