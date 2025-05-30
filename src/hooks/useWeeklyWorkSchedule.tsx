
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchWeeklyWorkSchedule, upsertWeeklyWorkSchedule, WeeklyWorkSchedule } from "@/lib/weekly-work-schedule-service";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";
import { toast } from "@/hooks/use-toast";

export const useWeeklyWorkSchedule = (userId: string, weekStartDate: Date) => {
  const { user } = useAuth();
  const { workingDays } = useWorkSchedule(userId);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyWorkSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate default daily hours based on working days
  const getDefaultDailyHours = (dayIndex: number): number => {
    // Monday = 1, Tuesday = 2, ..., Sunday = 0
    const workingDaysList = [];
    if (workingDays >= 1) workingDaysList.push(1); // Monday
    if (workingDays >= 2) workingDaysList.push(2); // Tuesday
    if (workingDays >= 3) workingDaysList.push(3); // Wednesday
    if (workingDays >= 4) workingDaysList.push(4); // Thursday
    if (workingDays >= 5) workingDaysList.push(5); // Friday
    if (workingDays >= 6) workingDaysList.push(6); // Saturday
    if (workingDays >= 7) workingDaysList.push(0); // Sunday

    return workingDaysList.includes(dayIndex) ? 8 : 0;
  };

  // Load weekly schedule
  const loadWeeklySchedule = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const schedule = await fetchWeeklyWorkSchedule(userId, weekStartDate);
      setWeeklySchedule(schedule);
    } catch (err) {
      console.error("Error loading weekly schedule:", err);
      setError("Failed to load weekly schedule");
    } finally {
      setLoading(false);
    }
  };

  // Update weekly schedule
  const updateWeeklySchedule = async (scheduleData: Partial<WeeklyWorkSchedule>) => {
    if (!userId) {
      console.error("No user ID available for updating weekly schedule");
      return;
    }

    try {
      const updatedSchedule = await upsertWeeklyWorkSchedule(userId, weekStartDate, scheduleData);
      setWeeklySchedule(updatedSchedule);
      
      toast({
        title: "Weekly Schedule Updated",
        description: `Weekly schedule has been updated successfully.`,
      });
    } catch (err) {
      console.error("Error updating weekly schedule:", err);
      setError("Failed to update weekly schedule");
      
      toast({
        title: "Error",
        description: "Failed to update weekly schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get effective daily hours (from weekly override or default)
  const getEffectiveDailyHours = () => {
    if (weeklySchedule) {
      return {
        monday: weeklySchedule.monday_hours,
        tuesday: weeklySchedule.tuesday_hours,
        wednesday: weeklySchedule.wednesday_hours,
        thursday: weeklySchedule.thursday_hours,
        friday: weeklySchedule.friday_hours,
        saturday: weeklySchedule.saturday_hours,
        sunday: weeklySchedule.sunday_hours,
      };
    }

    // Return default hours based on global working days
    return {
      monday: getDefaultDailyHours(1),
      tuesday: getDefaultDailyHours(2),
      wednesday: getDefaultDailyHours(3),
      thursday: getDefaultDailyHours(4),
      friday: getDefaultDailyHours(5),
      saturday: getDefaultDailyHours(6),
      sunday: getDefaultDailyHours(0),
    };
  };

  // Load schedule on mount and when dependencies change
  useEffect(() => {
    loadWeeklySchedule();
  }, [userId, weekStartDate]);

  // Set up real-time subscription for weekly schedule changes
  useEffect(() => {
    if (!userId) return;

    console.log(`Setting up realtime subscription for user ${userId} weekly schedule`);
    
    const channel = supabase
      .channel('weekly-work-schedule-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_work_schedules',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Weekly work schedule realtime update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newSchedule = payload.new as WeeklyWorkSchedule;
            if (newSchedule.week_start_date === weekStartDate.toISOString().split('T')[0]) {
              setWeeklySchedule(newSchedule);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedSchedule = payload.old as WeeklyWorkSchedule;
            if (deletedSchedule.week_start_date === weekStartDate.toISOString().split('T')[0]) {
              setWeeklySchedule(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`Cleaning up realtime subscription for user ${userId} weekly schedule`);
      supabase.removeChannel(channel);
    };
  }, [userId, weekStartDate]);

  return {
    weeklySchedule,
    effectiveDailyHours: getEffectiveDailyHours(),
    updateWeeklySchedule,
    loading,
    error,
    reload: loadWeeklySchedule,
    hasWeeklyOverride: !!weeklySchedule,
  };
};
