import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type WeeklyWorkSchedule = Database["public"]["Tables"]["weekly_work_schedules"]["Row"];
type WorkSchedule = Database["public"]["Tables"]["work_schedules"]["Row"];

export interface ScheduleReportFilters {
  startDate: Date;
  endDate: Date;
  userIds?: string[];
}

export interface ScheduleReportData {
  weeklySchedules: (WeeklyWorkSchedule & { profile?: any })[];
  globalSchedules: (WorkSchedule & { profile?: any })[];
  actualHours: { [key: string]: number };
}

export const fetchScheduleReportData = async (
  filters: ScheduleReportFilters
): Promise<ScheduleReportData> => {
  try {
    // Fetch weekly work schedules
    let weeklyQuery = supabase
      .from("weekly_work_schedules")
      .select(`
        *,
        profiles!weekly_work_schedules_user_id_fkey(full_name, email, employment_type)
      `)
      .gte("week_start_date", filters.startDate.toISOString().split("T")[0])
      .lte("week_start_date", filters.endDate.toISOString().split("T")[0])
      .order("week_start_date", { ascending: false });

    if (filters.userIds && filters.userIds.length > 0) {
      weeklyQuery = weeklyQuery.in("user_id", filters.userIds);
    }

    const { data: weeklySchedules, error: weeklyError } = await weeklyQuery;
    if (weeklyError) throw weeklyError;

    // Fetch global work schedules
    let globalQuery = supabase
      .from("work_schedules")
      .select(`
        *,
        profiles!fk_work_schedules_user(full_name, email, employment_type)
      `);

    if (filters.userIds && filters.userIds.length > 0) {
      globalQuery = globalQuery.in("user_id", filters.userIds);
    }

    const { data: globalSchedules, error: globalError } = await globalQuery;
    if (globalError) throw globalError;

    // Fetch actual hours logged in the date range
    let hoursQuery = supabase
      .from("timesheet_entries")
      .select("user_id, hours_logged")
      .gte("entry_date", filters.startDate.toISOString().split("T")[0])
      .lte("entry_date", filters.endDate.toISOString().split("T")[0]);

    if (filters.userIds && filters.userIds.length > 0) {
      hoursQuery = hoursQuery.in("user_id", filters.userIds);
    }

    const { data: timesheetData, error: hoursError } = await hoursQuery;
    if (hoursError) throw hoursError;

    // Calculate total hours by user
    const actualHours: { [key: string]: number } = {};
    timesheetData?.forEach((entry) => {
      actualHours[entry.user_id] =
        (actualHours[entry.user_id] || 0) + Number(entry.hours_logged);
    });

    return {
      weeklySchedules: weeklySchedules || [],
      globalSchedules: globalSchedules || [],
      actualHours,
    };
  } catch (error) {
    console.error("Error fetching schedule report data:", error);
    throw error;
  }
};
