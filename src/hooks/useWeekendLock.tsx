
import { useAuth } from "@/context/AuthContext";
import { isWeekend } from "@/lib/date-utils";
import { isAdmin } from "@/utils/roles";
import { useState, useEffect } from "react";

interface WeekendLockState {
  isWeekendLocked: (date: Date) => boolean;
  getWeekendMessage: (date: Date) => string;
  isLoading: boolean;
}

export const useWeekendLock = (): WeekendLockState => {
  const { user } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdminUser(false);
        setIsLoading(false);
        return;
      }

      try {
        const adminStatus = await isAdmin(user);
        setIsAdminUser(adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdminUser(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const isWeekendLocked = (date: Date): boolean => {
    // Admins can always add entries
    if (isAdminUser) return false;
    
    // Employees cannot add new entries on weekends
    return isWeekend(date);
  };

  const getWeekendMessage = (date: Date): string => {
    if (!isWeekend(date)) return "";
    
    if (isAdminUser) {
      return "Weekend entry (Admin access)";
    }
    
    return "Weekend entries are restricted for employees";
  };

  return {
    isWeekendLocked,
    getWeekendMessage,
    isLoading,
  };
};
