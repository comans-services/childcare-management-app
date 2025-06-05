
import { useAuth } from "@/context/AuthContext";
import { isWeekend } from "@/lib/date-utils";
import { isAdmin } from "@/utils/roles";
import { fetchWorkSchedule } from "@/lib/work-schedule-service";
import { useState, useEffect } from "react";

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
        // Check if current user is admin
        const adminStatus = await isAdmin(user);
        setIsAdminUser(adminStatus);

        // Fetch the target user's work schedule to check weekend entry permission
        const workSchedule = await fetchWorkSchedule(userId);
        setAllowWeekendEntries(workSchedule?.allow_weekend_entries || false);
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

  const isWeekendLocked = (date: Date): boolean => {
    // Not a weekend, so not locked
    if (!isWeekend(date)) return false;
    
    // Admins can always add entries
    if (isAdminUser) return false;
    
    // Check if the target user has weekend entry permission
    if (allowWeekendEntries) return false;
    
    // Default: weekends are locked for regular employees
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
    
    return "Weekend entries are restricted for this user";
  };

  return {
    isWeekendLocked,
    getWeekendMessage,
    isLoading,
  };
};
