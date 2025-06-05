
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchWorkSchedule, upsertWorkSchedule, updateWeekendEntryPermission, migrateLocalStorageToDatabase, getDefaultWorkingDays } from "@/lib/work-schedule-service";
import { toast } from "@/hooks/use-toast";

export const useWorkSchedule = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const [workingDays, setWorkingDays] = useState<number>(5); // Default to 5 days
  const [allowWeekendEntries, setAllowWeekendEntries] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate weekly target based on working days
  const weeklyTarget = workingDays * 8;

  // Load work schedule from database
  const loadWorkSchedule = async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // First, try to migrate any existing localStorage data
      await migrateLocalStorageToDatabase(targetUserId);
      
      // Then fetch from database
      const schedule = await fetchWorkSchedule(targetUserId);
      
      if (schedule) {
        setWorkingDays(schedule.working_days);
        setAllowWeekendEntries(schedule.allow_weekend_entries || false);
        console.log(`Loaded work schedule from database: ${schedule.working_days} days, weekend entries: ${schedule.allow_weekend_entries} for user ${targetUserId}`);
      } else {
        // Get default based on employment type
        const defaultDays = await getDefaultWorkingDays(targetUserId);
        
        // Fallback to localStorage for emergency backup
        const localStorageKey = targetUserId === user?.id 
          ? "timesheet-working-days" 
          : `timesheet-working-days-${targetUserId}`;
        
        const saved = localStorage.getItem(localStorageKey);
        const fallbackDays = saved && !isNaN(parseInt(saved)) ? parseInt(saved) : defaultDays;
        
        setWorkingDays(fallbackDays);
        setAllowWeekendEntries(false); // Default to false for new users
        console.log(`Using ${saved ? 'localStorage' : 'employment type default'} work schedule: ${fallbackDays} days for user ${targetUserId}`);
        
        // Try to save the fallback to database
        try {
          await upsertWorkSchedule(targetUserId, fallbackDays);
        } catch (err) {
          console.error("Failed to save fallback schedule to database:", err);
        }
      }
    } catch (err) {
      console.error("Error loading work schedule:", err);
      setError("Failed to load work schedule");
      
      // Emergency fallback to employment type default or localStorage
      try {
        const defaultDays = await getDefaultWorkingDays(targetUserId);
        const localStorageKey = targetUserId === user?.id 
          ? "timesheet-working-days" 
          : `timesheet-working-days-${targetUserId}`;
        
        const saved = localStorage.getItem(localStorageKey);
        setWorkingDays(saved && !isNaN(parseInt(saved)) ? parseInt(saved) : defaultDays);
        setAllowWeekendEntries(false);
      } catch {
        setWorkingDays(5); // Final fallback
        setAllowWeekendEntries(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update working days in database
  const updateWorkingDays = async (days: number) => {
    if (!targetUserId) {
      console.error("No user ID available for updating work schedule");
      return;
    }

    // Validate the input
    if (days < 0 || days > 7 || isNaN(days)) {
      console.error("Invalid working days value:", days);
      return;
    }

    try {
      console.log(`Updating work schedule for user ${targetUserId}: ${days} days`);
      
      // Update database
      await upsertWorkSchedule(targetUserId, days);
      
      // Update local state
      setWorkingDays(days);
      
      // Keep localStorage in sync as backup (using the new pattern)
      const localStorageKey = targetUserId === user?.id 
        ? "timesheet-working-days" 
        : `timesheet-working-days-${targetUserId}`;
      localStorage.setItem(localStorageKey, days.toString());
      
      console.log(`Work schedule updated successfully: ${days} days for user ${targetUserId}`);
      
      // Show success message only for the current user
      if (targetUserId === user?.id) {
        toast({
          title: "Work Schedule Updated",
          description: `Your work schedule has been updated to ${days} days per week.`,
        });
      }
    } catch (err) {
      console.error("Error updating work schedule:", err);
      setError("Failed to update work schedule");
      
      toast({
        title: "Error",
        description: "Failed to update work schedule. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update weekend entry permission
  const updateWeekendPermission = async (allowed: boolean) => {
    if (!targetUserId) {
      console.error("No user ID available for updating weekend permission");
      return;
    }

    try {
      console.log(`Updating weekend entry permission for user ${targetUserId}: ${allowed}`);
      
      // Update database
      await updateWeekendEntryPermission(targetUserId, allowed);
      
      // Update local state
      setAllowWeekendEntries(allowed);
      
      console.log(`Weekend entry permission updated successfully: ${allowed} for user ${targetUserId}`);
      
      // Show success message only for the current user
      if (targetUserId === user?.id) {
        toast({
          title: "Weekend Permission Updated",
          description: `Weekend time entry has been ${allowed ? 'enabled' : 'disabled'}.`,
        });
      }
    } catch (err) {
      console.error("Error updating weekend permission:", err);
      setError("Failed to update weekend permission");
      
      toast({
        title: "Error",
        description: "Failed to update weekend permission. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load work schedule on mount and when user changes
  useEffect(() => {
    loadWorkSchedule();
  }, [targetUserId]);

  // Set up real-time subscription for work schedule changes
  useEffect(() => {
    if (!targetUserId) return;

    console.log(`Setting up realtime subscription for user ${targetUserId} work schedule`);
    
    const channel = supabase
      .channel('work-schedule-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_schedules',
          filter: `user_id=eq.${targetUserId}`
        },
        (payload) => {
          console.log('Work schedule realtime update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newWorkingDays = payload.new?.working_days;
            const newAllowWeekendEntries = payload.new?.allow_weekend_entries;
            
            if (typeof newWorkingDays === 'number') {
              setWorkingDays(newWorkingDays);
              console.log(`Realtime update: work schedule changed to ${newWorkingDays} days`);
              
              // Update localStorage backup
              const localStorageKey = targetUserId === user?.id 
                ? "timesheet-working-days" 
                : `timesheet-working-days-${targetUserId}`;
              localStorage.setItem(localStorageKey, newWorkingDays.toString());
            }
            
            if (typeof newAllowWeekendEntries === 'boolean') {
              setAllowWeekendEntries(newAllowWeekendEntries);
              console.log(`Realtime update: weekend entries permission changed to ${newAllowWeekendEntries}`);
            }
            
            // Show notification only for the current user
            if (targetUserId === user?.id) {
              toast({
                title: "Work Schedule Updated",
                description: `Your work schedule has been updated.`,
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
  }, [targetUserId, user?.id]);

  return {
    workingDays,
    allowWeekendEntries,
    weeklyTarget,
    updateWorkingDays,
    updateWeekendPermission,
    loading,
    error,
    reload: loadWorkSchedule,
  };
};
