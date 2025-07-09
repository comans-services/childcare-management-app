
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";

// Server-side holiday validation with enhanced granular permissions
export const validateHolidayEntry = async (entryDate: string): Promise<{ isValid: boolean; message?: string; holidayName?: string }> => {
  try {
    const date = new Date(entryDate);
    console.log(`Enhanced holiday validation for date: ${date.toDateString()}`);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error during holiday validation:", authError);
      return { isValid: false, message: "Authentication required" };
    }

    // Use the new enhanced holiday permission checking function
    const { data: permissionResult, error: permissionError } = await supabase.rpc(
      'check_user_holiday_permission',
      {
        p_user_id: user.id,
        p_holiday_date: formatDate(date),
        p_target_state: 'VIC'
      }
    );

    if (permissionError) {
      console.error("Error checking holiday permission:", permissionError);
      return { isValid: true }; // Fail open - allow entry if we can't check
    }

    // The function returns an array with one result
    const result = permissionResult?.[0];
    if (!result) {
      return { isValid: true }; // No holiday data, allow entry
    }

    console.log("Holiday permission check result:", result);

    return {
      isValid: result.is_allowed,
      message: result.message,
      holidayName: result.holiday_name
    };
  } catch (error) {
    console.error("Error in enhanced holiday validation:", error);
    return { isValid: false, message: "Error validating holiday entry" };
  }
};

// Client-side helper to check if a date is a holiday (for UI indicators)
export const isHoliday = async (date: Date): Promise<{ isHoliday: boolean; holidayName?: string }> => {
  try {
    const { data: isHolidayResult, error } = await supabase.rpc('is_public_holiday', {
      entry_date: formatDate(date),
      target_state: 'VIC'
    });

    if (error || !isHolidayResult) {
      return { isHoliday: false };
    }

    // Get holiday name if it is a holiday
    const { data: holidayName } = await supabase.rpc('get_public_holiday_name', {
      entry_date: formatDate(date),
      target_state: 'VIC'
    });

    return { 
      isHoliday: true, 
      holidayName: holidayName || undefined 
    };
  } catch (error) {
    console.error("Error checking holiday status:", error);
    return { isHoliday: false };
  }
};
