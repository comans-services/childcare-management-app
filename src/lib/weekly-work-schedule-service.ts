import { supabase } from "@/integrations/supabase/client";

export interface WeeklyWorkSchedule {
  id?: string;
  user_id: string;
  week_start_date: string;
  monday_hours: number;
  tuesday_hours: number;
  wednesday_hours: number;
  thursday_hours: number;
  friday_hours: number;
  saturday_hours: number;
  sunday_hours: number;
  created_at?: string;
  updated_at?: string;
}

export const fetchWeeklyWorkSchedule = async (
  userId: string,
  weekStartDate: Date
): Promise<WeeklyWorkSchedule | null> => {
  const weekStartString = weekStartDate.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('weekly_work_schedules')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartString)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching weekly schedule:", error);
    throw error;
  }
  
  return data;
};

export const upsertWeeklyWorkSchedule = async (
  userId: string,
  weekStartDate: Date,
  scheduleData: Partial<WeeklyWorkSchedule>
): Promise<WeeklyWorkSchedule> => {
  const weekStartString = weekStartDate.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('weekly_work_schedules')
    .upsert({
      user_id: userId,
      week_start_date: weekStartString,
      monday_hours: scheduleData.monday_hours ?? 0,
      tuesday_hours: scheduleData.tuesday_hours ?? 0,
      wednesday_hours: scheduleData.wednesday_hours ?? 0,
      thursday_hours: scheduleData.thursday_hours ?? 0,
      friday_hours: scheduleData.friday_hours ?? 0,
      saturday_hours: scheduleData.saturday_hours ?? 0,
      sunday_hours: scheduleData.sunday_hours ?? 0,
    }, {
      onConflict: 'user_id,week_start_date'
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error upserting weekly schedule:", error);
    throw error;
  }
  
  return data;
};

export const deleteWeeklyWorkSchedule = async (
  userId: string,
  weekStartDate: Date
): Promise<void> => {
  const weekStartString = weekStartDate.toISOString().split('T')[0];
  
  const { error } = await supabase
    .from('weekly_work_schedules')
    .delete()
    .eq('user_id', userId)
    .eq('week_start_date', weekStartString);
  
  if (error) {
    console.error("Error deleting weekly schedule:", error);
    throw error;
  }
};

export const calculateWeeklyTotal = (schedule: WeeklyWorkSchedule): number => {
  return (
    Number(schedule.monday_hours || 0) +
    Number(schedule.tuesday_hours || 0) +
    Number(schedule.wednesday_hours || 0) +
    Number(schedule.thursday_hours || 0) +
    Number(schedule.friday_hours || 0) +
    Number(schedule.saturday_hours || 0) +
    Number(schedule.sunday_hours || 0)
  );
};

export const getDayName = (dayIndex: number): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayIndex];
};

export const getWorkingDaysList = (schedule: WeeklyWorkSchedule): string[] => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = [
    schedule.monday_hours,
    schedule.tuesday_hours,
    schedule.wednesday_hours,
    schedule.thursday_hours,
    schedule.friday_hours,
    schedule.saturday_hours,
    schedule.sunday_hours,
  ];
  
  return days.filter((_, index) => hours[index] > 0);
};

export const formatDaysSummary = (schedule: WeeklyWorkSchedule): string => {
  const workingDays = getWorkingDaysList(schedule);
  const totalHours = calculateWeeklyTotal(schedule);
  
  if (workingDays.length === 0) {
    return "No working days";
  }
  
  return `${workingDays.join(', ')} (${totalHours}hrs)`;
};
