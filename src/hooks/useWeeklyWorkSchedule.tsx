
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchWeeklyWorkSchedule, upsertWeeklyWorkSchedule, getDefaultWeeklyHours } from "@/lib/weekly-work-schedule-service";
import { toast } from "@/hooks/use-toast";
import { startOfWeek, format } from "date-fns";

export const useWeeklyWorkSchedule = (userId?: string, weekDate?: Date) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const currentWeekDate = weekDate || new Date();
  
  const [weeklyHours, setWeeklyHours] = useState({
    monday_hours: 8,
    tuesday_hours: 8,
    wednesday_hours: 8,
    thursday_hours: 8,
    friday_hours: 8,
    saturday_hours: 0,
    sunday_hours: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate total weekly hours
  const totalWeeklyHours = Object.values(weeklyHours).reduce((sum, hours) => sum + hours, 0);

  // Load weekly work schedule
  const loadWeeklySchedule = async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const schedule = await fetchWeeklyWorkSchedule(targetUserId, currentWeekDate);
      
      if (schedule) {
        setWeeklyHours({
          monday_hours: schedule.monday_hours,
          tuesday_hours: schedule.tuesday_hours,
          wednesday_hours: schedule.wednesday_hours,
          thursday_hours: schedule.thursday_hours,
          friday_hours: schedule.friday_hours,
          saturday_hours: schedule.saturday_hours,
          sunday_hours: schedule.sunday_hours
        });
        console.log(`Loaded weekly schedule from database for week ${format(currentWeekDate, 'yyyy-MM-dd')}`);
      } else {
        // Use defaults based on employment type
        const defaultHours = await getDefaultWeeklyHours(targetUserId);
        setWeeklyHours(defaultHours);
        console.log(`Using default weekly hours for user ${targetUserId}`);
      }
    } catch (err) {
      console.error("Error loading weekly schedule:", err);
      setError("Failed to load weekly schedule");
      
      // Fallback to defaults
      const defaultHours = await getDefaultWeeklyHours(targetUserId);
      setWeeklyHours(defaultHours);
    } finally {
      setLoading(false);
    }
  };

  // Update daily hours
  const updateDayHours = async (day: keyof typeof weeklyHours, hours: number) => {
    if (!targetUserId) {
      console.error("No user ID available for updating weekly schedule");
      return;
    }

    // Validate the input
    if (hours < 0 || hours > 24 || isNaN(hours)) {
      console.error("Invalid hours value:", hours);
      return;
    }

    try {
      console.log(`Updating ${day} hours for user ${targetUserId}: ${hours} hours`);
      
      const updatedHours = { ...weeklyHours, [day]: hours };
      
      // Update database
      await upsertWeeklyWorkSchedule(targetUserId, currentWeekDate, updatedHours);
      
      // Update local state
      setWeeklyHours(updatedHours);
      
      console.log(`Weekly schedule updated successfully for week ${format(currentWeekDate, 'yyyy-MM-dd')}`);
      
      // Show success message only for the current user
      if (targetUserId === user?.id) {
        toast({
          title: "Schedule Updated",
          description: `${day.replace('_hours', '').charAt(0).toUpperCase() + day.replace('_hours', '').slice(1)} hours updated to ${hours}.`,
        });
      }
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

  // Load schedule when dependencies change
  useEffect(() => {
    loadWeeklySchedule();
  }, [targetUserId, format(currentWeekDate, 'yyyy-MM-dd')]);

  // Set up real-time subscription
  useEffect(() => {
    if (!targetUserId) return;

    const weekStart = format(startOfWeek(currentWeekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    console.log(`Setting up realtime subscription for user ${targetUserId} weekly schedule`);
    
    const channel = supabase
      .channel('weekly-schedule-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_work_schedules',
          filter: `user_id=eq.${targetUserId}`
        },
        (payload) => {
          console.log('Weekly schedule realtime update:', payload);
          
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') 
              && payload.new?.week_start_date === weekStart) {
            const newSchedule = payload.new;
            setWeeklyHours({
              monday_hours: newSchedule.monday_hours,
              tuesday_hours: newSchedule.tuesday_hours,
              wednesday_hours: newSchedule.wednesday_hours,
              thursday_hours: newSchedule.thursday_hours,
              friday_hours: newSchedule.friday_hours,
              saturday_hours: newSchedule.saturday_hours,
              sunday_hours: newSchedule.sunday_hours
            });
            
            console.log(`Realtime update: weekly schedule changed for week ${weekStart}`);
            
            // Show notification only for the current user
            if (targetUserId === user?.id) {
              toast({
                title: "Schedule Updated",
                description: "Your weekly schedule has been updated.",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`Cleaning up realtime subscription for user ${targetUserId}`);
      supabase.removeChannel(channel);
    };
  }, [targetUserId, format(currentWeekDate, 'yyyy-MM-dd'), user?.id]);

  return {
    weeklyHours,
    totalWeeklyHours,
    updateDayHours,
    loading,
    error,
    reload: loadWeeklySchedule,
  };
};
