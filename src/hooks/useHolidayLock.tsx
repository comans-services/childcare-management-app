import { useMemo } from "react";
import { isHoliday } from "@/lib/timesheet/validation/holiday-validation-service";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface HolidayValidationResult {
  isValid: boolean;
  message?: string;
  holidayName?: string;
}

export const useHolidayLock = (userId?: string) => {
  const { userRole } = useAuth();
  
  // Fetch user's holiday permissions
  const { data: workSchedule } = useQuery({
    queryKey: ["work-schedule-holiday", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("work_schedules")
        .select("allow_holiday_entries")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching holiday permissions:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!userId,
  });

  const isAdminUser = userRole === 'admin';

  const canCreateHolidayEntries = useMemo(() => {
    if (isAdminUser) return true;
    return workSchedule?.allow_holiday_entries || false;
  }, [workSchedule?.allow_holiday_entries, isAdminUser]);

  const validateHolidayEntry = useMemo(() => {
    return async (date: Date): Promise<HolidayValidationResult> => {
      try {
        // Check if date is a holiday
        const { isHoliday: isHolidayDate, holidayName } = await isHoliday(date);
        
        if (!isHolidayDate) {
          return { isValid: true };
        }

        // Admin override
        if (userProfile?.role === 'admin') {
          return { 
            isValid: true, 
            holidayName,
            message: "Admin privilege allows holiday entries" 
          };
        }

        // Check user permission
        if (!canCreateHolidayEntries) {
          return {
            isValid: false,
            message: `Holiday entries are not allowed on ${holidayName || 'public holidays'}. Please contact your administrator for approval.`,
            holidayName
          };
        }

        return { 
          isValid: true, 
          holidayName,
          message: "Holiday entry allowed" 
        };
      } catch (error) {
        console.error("Error validating holiday entry:", error);
        return {
          isValid: false,
          message: "Error validating holiday entry"
        };
      }
    };
  }, [canCreateHolidayEntries, userProfile?.role]);

  // Helper to check if a date is a holiday (for UI indicators)
  const checkIfHoliday = useMemo(() => {
    return async (date: Date) => {
      return await isHoliday(date);
    };
  }, []);

  return {
    canCreateHolidayEntries,
    validateHolidayEntry,
    checkIfHoliday,
    isAdmin: userProfile?.role === 'admin'
  };
};
