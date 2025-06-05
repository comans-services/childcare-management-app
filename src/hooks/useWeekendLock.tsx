
import { useAuth } from "@/context/AuthContext";
import { isWeekend } from "@/lib/date-utils";
import { isAdmin } from "@/utils/roles";
import { fetchWorkSchedule } from "@/lib/work-schedule-service";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WeekendLockState {
  isWeekendLocked: (date: Date) => boolean;
  getWeekendMessage: (date: Date) => string;
  isLoading: boolean;
}

export const useWeekendLock = (targetUserId?: string): WeekendLockState => {
  const { user } = useAuth();
  const userId = targetUserId || user?.id;
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [allowWeekendEntries, setAllowWeekendEntries] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user || !userId) {
        setIsAdminUser(false);
        setAllowWeekendEntries(false);
        setIsLoading(false);
        return;
      }

      try {
        console.log(`=== WEEKEND LOCK CHECK ===`);
        console.log(`Checking permissions for user: ${userId}`);
        console.log(`Current user: ${user.id}`);
        
        // Check if current user is admin
        const adminStatus = await isAdmin(user);
        console.log(`Admin status: ${adminStatus}`);
        setIsAdminUser(adminStatus);

        // Fetch the target user's work schedule to check weekend entry permission
        const workSchedule = await fetchWorkSchedule(userId);
        const weekendPermission = workSchedule?.allow_weekend_entries || false;
        console.log(`Weekend permission: ${weekendPermission}`);
        setAllowWeekendEntries(weekendPermission);
      } catch (error) {
        console.error("Error checking permissions:", error);
        setIsAdminUser(false);
        setAllowWeekendEntries(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [user, userId]);

  // Set up real-time subscription for work schedule changes
  useEffect(() => {
    if (!userId) return;

    console.log(`Setting up weekend lock realtime subscription for user ${userId}`);
    
    const channel = supabase
      .channel('weekend-lock-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_schedules',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Work schedule realtime update for weekend lock:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newAllowWeekendEntries = payload.new?.allow_weekend_entries;
            
            if (typeof newAllowWeekendEntries === 'boolean') {
              setAllowWeekendEntries(newAllowWeekendEntries);
              console.log(`Realtime update: weekend entries permission changed to ${newAllowWeekendEntries}`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`Cleaning up weekend lock realtime subscription for user ${userId}`);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const isWeekendLocked = (date: Date): boolean => {
    console.log(`=== WEEKEND LOCK EVALUATION ===`);
    console.log(`Date: ${date.toISOString()}`);
    console.log(`Is weekend: ${isWeekend(date)}`);
    console.log(`Is admin: ${isAdminUser}`);
    console.log(`Allow weekend entries: ${allowWeekendEntries}`);
    
    // Not a weekend, so not locked
    if (!isWeekend(date)) {
      console.log("Not weekend - not locked");
      return false;
    }
    
    // Admins can always add entries
    if (isAdminUser) {
      console.log("Admin user - not locked");
      return false;
    }
    
    // Check if the target user has weekend entry permission
    if (allowWeekendEntries) {
      console.log("Weekend permission granted - not locked");
      return false;
    }
    
    // Default: weekends are locked for regular employees
    console.log("Weekend locked for regular user");
    return true;
  };

  const getWeekendMessage = (date: Date): string => {
    if (!isWeekend(date)) return "";
    
    if (isAdminUser) {
      return "Weekend entry (Admin access)";
    }
    
    if (allowWeekendEntries) {
      return "Weekend entry (Permitted)";
    }
    
    return "Weekend time entries require admin approval. Contact your administrator to enable weekend entries for your account.";
  };

  return {
    isWeekendLocked,
    getWeekendMessage,
    isLoading,
  };
};
