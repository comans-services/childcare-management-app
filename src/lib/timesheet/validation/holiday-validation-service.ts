
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";

// Server-side holiday validation with admin override
export const validateHolidayEntry = async (entryDate: string): Promise<{ isValid: boolean; message?: string; holidayName?: string }> => {
  try {
    const date = new Date(entryDate);
    console.log(`Server-side holiday validation for date: ${date.toDateString()}`);
    
    // Check if the date is a public holiday
    const { data: isHoliday, error: holidayCheckError } = await supabase.rpc('is_public_holiday', {
      entry_date: formatDate(date),
      target_state: 'VIC'
    });

    if (holidayCheckError) {
      console.error("Error checking if date is public holiday:", holidayCheckError);
      return { isValid: true }; // Fail open - allow entry if we can't check
    }

    // If it's not a public holiday, always allow
    if (!isHoliday) {
      return { isValid: true };
    }

    // Get the holiday name for display
    const { data: holidayName, error: nameError } = await supabase.rpc('get_public_holiday_name', {
      entry_date: formatDate(date),
      target_state: 'VIC'
    });

    if (nameError) {
      console.error("Error fetching holiday name:", nameError);
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error during holiday validation:", authError);
      return { isValid: false, message: "Authentication required", holidayName: holidayName || undefined };
    }

    // Check if user is admin - admins can ALWAYS log holiday entries
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return { isValid: false, message: "Error validating permissions", holidayName: holidayName || undefined };
    }

    // Admin override: admins can always log holiday entries regardless of settings
    if (profile?.role === 'admin') {
      console.log("Admin override: allowing holiday entry");
      return { isValid: true, holidayName: holidayName || undefined };
    }

    // For non-admin users, check their holiday permissions
    const { data: workSchedule, error: scheduleError } = await supabase
      .from("work_schedules")
      .select("allow_holiday_entries")
      .eq("user_id", user.id)
      .maybeSingle();

    if (scheduleError) {
      console.error("Error fetching work schedule:", scheduleError);
      return { isValid: false, message: "Error validating holiday permissions", holidayName: holidayName || undefined };
    }

    const allowHolidayEntries = workSchedule?.allow_holiday_entries || false;
    console.log(`User holiday permission: ${allowHolidayEntries}`);

    if (!allowHolidayEntries) {
      return { 
        isValid: false, 
        message: `Holiday entries are not allowed on ${holidayName || 'public holidays'}. Please contact your administrator for approval.`,
        holidayName: holidayName || undefined
      };
    }

    return { isValid: true, holidayName: holidayName || undefined };
  } catch (error) {
    console.error("Error in holiday validation:", error);
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
