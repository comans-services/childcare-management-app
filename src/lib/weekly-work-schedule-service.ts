// Stub file - weekly_work_schedules table doesn't exist

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
  console.log("Note: weekly_work_schedules table does not exist. Returning null.");
  return null;
};

export const upsertWeeklyWorkSchedule = async (
  userId: string,
  weekStartDate: Date,
  scheduleData: Partial<WeeklyWorkSchedule>
): Promise<WeeklyWorkSchedule> => {
  console.log("Note: weekly_work_schedules table does not exist. Returning dummy data.");
  return {
    user_id: userId,
    week_start_date: weekStartDate.toISOString().split('T')[0],
    monday_hours: 8,
    tuesday_hours: 8,
    wednesday_hours: 8,
    thursday_hours: 8,
    friday_hours: 8,
    saturday_hours: 0,
    sunday_hours: 0
  };
};
