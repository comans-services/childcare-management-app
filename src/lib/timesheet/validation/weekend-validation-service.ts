
import { supabase } from "@/integrations/supabase/client";
import { isWeekend } from "@/lib/date-utils";

// Server-side weekend validation
export const validateWeekendEntry = async (entryDate: string): Promise<{ isValid: boolean; message?: string }> => {
  try {
    const date = new Date(entryDate);
    console.log(`Server-side weekend validation for date: ${date.toDateString()}`);
    
    // If it's not a weekend, always allow
    if (!isWeekend(date)) {
      return { isValid: true };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error during weekend validation:", authError);
      return { isValid: false, message: "Authentication required" };
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return { isValid: false, message: "Error validating permissions" };
    }

    // Admins can always log weekend entries
    if (profile?.role === 'admin') {
      console.log("Admin override: allowing weekend entry");
      return { isValid: true };
    }

    // Check user's weekend permissions
    const { data: workSchedule, error: scheduleError } = await supabase
      .from("work_schedules")
      .select("allow_weekend_entries")
      .eq("user_id", user.id)
      .maybeSingle();

    if (scheduleError) {
      console.error("Error fetching work schedule:", scheduleError);
      return { isValid: false, message: "Error validating weekend permissions" };
    }

    const allowWeekendEntries = workSchedule?.allow_weekend_entries || false;
    console.log(`User weekend permission: ${allowWeekendEntries}`);

    if (!allowWeekendEntries) {
      return { 
        isValid: false, 
        message: "Weekend entries are not allowed. Please contact your administrator for approval." 
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error in weekend validation:", error);
    return { isValid: false, message: "Error validating weekend entry" };
  }
};
