import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";

export const validateHolidayEntry = async (entryDate: string, userId?: string): Promise<{ isValid: boolean; message?: string; holidayName?: string }> => {
  try {
    const date = new Date(entryDate);
    
    const { data: isHolidayResult, error } = await supabase.rpc('is_public_holiday', {
      check_date: formatDate(date),
      check_state: 'VIC'
    });

    if (error) {
      console.error("Error checking holiday:", error);
      return { isValid: true };
    }

    if (!isHolidayResult) {
      return { isValid: true };
    }

    const { data: holidays } = await supabase
      .from('public_holidays')
      .select('name')
      .eq('date', formatDate(date))
      .eq('state', 'VIC')
      .maybeSingle();

    const holidayName = holidays?.name;

    // If we have a userId, check per-user permissions
    if (userId) {
      // Check if user is admin
      const { data: adminRole } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle() as any;

      if (adminRole?.role === 'admin') {
        return { isValid: true, holidayName, message: 'Admin override: holiday entry allowed' };
      }

      // Check user's allow_holiday_entries permission
      const { data: workSchedule } = await supabase
        .from('work_schedules')
        .select('allow_holiday_entries')
        .eq('user_id', userId)
        .maybeSingle();

      if (workSchedule?.allow_holiday_entries) {
        return { isValid: true, holidayName, message: 'Holiday entry allowed by permission' };
      }
    }

    return {
      isValid: false,
      message: `This is a public holiday${holidayName ? ': ' + holidayName : ''}. Holiday entries are not allowed.`,
      holidayName
    };
  } catch (error) {
    console.error("Error in holiday validation:", error);
    return { isValid: true };
  }
};

export const isHoliday = async (date: Date): Promise<{ isHoliday: boolean; holidayName?: string }> => {
  try {
    const { data: isHolidayResult, error } = await supabase.rpc('is_public_holiday', {
      check_date: formatDate(date),
      check_state: 'VIC'
    });

    if (error || !isHolidayResult) {
      return { isHoliday: false };
    }

    const { data: holidays } = await supabase
      .from('public_holidays')
      .select('name')
      .eq('date', formatDate(date))
      .eq('state', 'VIC')
      .maybeSingle();

    return { 
      isHoliday: true, 
      holidayName: holidays?.name || undefined 
    };
  } catch (error) {
    console.error("Error checking holiday status:", error);
    return { isHoliday: false };
  }
};
