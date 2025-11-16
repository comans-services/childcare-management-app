import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";

export const validateHolidayEntry = async (entryDate: string): Promise<{ isValid: boolean; message?: string; holidayName?: string }> => {
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

    return {
      isValid: false,
      message: `This is a public holiday${holidays?.name ? ': ' + holidays.name : ''}`,
      holidayName: holidays?.name
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
