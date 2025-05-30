
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, format } from "date-fns";

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
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const fetchWeeklyWorkSchedule = async (userId: string, weekStartDate: Date): Promise<WeeklyWorkSchedule | null> => {
  try {
    const weekStart = format(startOfWeek(weekStartDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    console.log(`Fetching weekly work schedule for user: ${userId}, week: ${weekStart}`);
    
    const { data, error } = await supabase
      .from("weekly_work_schedules")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start_date", weekStart)
      .maybeSingle();

    if (error) {
      console.error("Error fetching weekly work schedule:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchWeeklyWorkSchedule:", error);
    return null;
  }
};

export const upsertWeeklyWorkSchedule = async (
  userId: string, 
  weekStartDate: Date, 
  dayHours: {
    monday_hours: number;
    tuesday_hours: number;
    wednesday_hours: number;
    thursday_hours: number;
    friday_hours: number;
    saturday_hours: number;
    sunday_hours: number;
  }
): Promise<WeeklyWorkSchedule | null> => {
  try {
    const weekStart = format(startOfWeek(weekStartDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    console.log(`Upserting weekly work schedule for user ${userId}, week ${weekStart}:`, dayHours);
    
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    const { data, error } = await supabase
      .from("weekly_work_schedules")
      .upsert({
        user_id: userId,
        week_start_date: weekStart,
        ...dayHours,
        created_by: currentUser.id,
        updated_at: new Date().toISOString()
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

export const getDefaultWeeklyHours = async (userId: string): Promise<{
  monday_hours: number;
  tuesday_hours: number;
  wednesday_hours: number;
  thursday_hours: number;
  friday_hours: number;
  saturday_hours: number;
  sunday_hours: number;
}> => {
  try {
    // Get user's employment type from profiles
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("employment_type")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user profile:", error);
    }

    // Default to 8 hours for weekdays, 0 for weekends
    // Adjust for part-time workers (6 hours per day for 3 days = 18 hours total)
    const isPartTime = profile?.employment_type === 'part-time';
    const defaultWeekdayHours = isPartTime ? 6 : 8;
    
    return {
      monday_hours: defaultWeekdayHours,
      tuesday_hours: defaultWeekdayHours,
      wednesday_hours: defaultWeekdayHours,
      thursday_hours: isPartTime ? 0 : defaultWeekdayHours,
      friday_hours: isPartTime ? 0 : defaultWeekdayHours,
      saturday_hours: 0,
      sunday_hours: 0
    };
  } catch (error) {
    console.error("Error getting default weekly hours:", error);
    return {
      monday_hours: 8,
      tuesday_hours: 8,
      wednesday_hours: 8,
      thursday_hours: 8,
      friday_hours: 8,
      saturday_hours: 0,
      sunday_hours: 0
    };
  }
};
