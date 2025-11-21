
import { supabase } from "@/integrations/supabase/client";

export interface WorkSchedule {
  id: string;
  user_id: string;
  working_days: number;
  monday_hours?: number;
  tuesday_hours?: number;
  wednesday_hours?: number;
  thursday_hours?: number;
  friday_hours?: number;
  saturday_hours?: number;
  sunday_hours?: number;
  created_at: string;
  created_by?: string;
}

export const fetchWorkSchedule = async (userId?: string): Promise<WorkSchedule | null> => {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    
    if (!targetUserId) {
      console.error("No user ID provided for work schedule fetch");
      return null;
    }

    console.log(`Fetching work schedule for user: ${targetUserId}`);
    
    const { data, error } = await supabase
      .from("work_schedules")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching work schedule:", error);
      return null;
    }

    console.log(`Work schedule fetched:`, data);
    return data;
  } catch (error) {
    console.error("Error in fetchWorkSchedule:", error);
    return null;
  }
};

export const getDefaultWorkingDays = async (userId: string): Promise<number> => {
  try {
    // Fetch user's employment type from profiles
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("employment_type")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user profile:", error);
      return 5; // Default fallback
    }

    // Full-time employees always work Mon-Fri (5 days)
    if (profile?.employment_type === 'full-time') {
      return 5;
    }
    
    // Part-time/casual default to 3 days (can be customized)
    const defaultDays = profile?.employment_type === 'part-time' ? 3 : 5;
    console.log(`Default working days for user ${userId} (${profile?.employment_type}): ${defaultDays}`);
    return defaultDays;
  } catch (error) {
    console.error("Error getting default working days:", error);
    return 5; // Default fallback
  }
};

export const getDefaultWeeklySchedule = (employmentType: string, templateSchedule?: WorkSchedule) => {
  // If template hours are set, use them
  if (templateSchedule && hasTemplateHours(templateSchedule)) {
    return {
      monday_hours: templateSchedule.monday_hours || 0,
      tuesday_hours: templateSchedule.tuesday_hours || 0,
      wednesday_hours: templateSchedule.wednesday_hours || 0,
      thursday_hours: templateSchedule.thursday_hours || 0,
      friday_hours: templateSchedule.friday_hours || 0,
      saturday_hours: templateSchedule.saturday_hours || 0,
      sunday_hours: templateSchedule.sunday_hours || 0,
    };
  }

  if (employmentType === 'full-time') {
    // Full-time: Mon-Fri, 8 hours each
    return {
      monday_hours: 8,
      tuesday_hours: 8,
      wednesday_hours: 8,
      thursday_hours: 8,
      friday_hours: 8,
      saturday_hours: 0,
      sunday_hours: 0,
    };
  }
  
  // Part-time/casual: No days by default (must be configured via template)
  return {
    monday_hours: 0,
    tuesday_hours: 0,
    wednesday_hours: 0,
    thursday_hours: 0,
    friday_hours: 0,
    saturday_hours: 0,
    sunday_hours: 0,
  };
};

export const hasTemplateHours = (schedule: WorkSchedule): boolean => {
  return !!(
    schedule.monday_hours ||
    schedule.tuesday_hours ||
    schedule.wednesday_hours ||
    schedule.thursday_hours ||
    schedule.friday_hours ||
    schedule.saturday_hours ||
    schedule.sunday_hours
  );
};

export const upsertWorkScheduleTemplate = async (
  userId: string,
  templateHours: {
    monday_hours: number;
    tuesday_hours: number;
    wednesday_hours: number;
    thursday_hours: number;
    friday_hours: number;
    saturday_hours: number;
    sunday_hours: number;
  }
): Promise<WorkSchedule | null> => {
  try {
    console.log(`Upserting work schedule template for user ${userId}`);
    
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    // Calculate working days from template
    const workingDays = Object.values(templateHours).filter(h => h > 0).length;

    const { data, error } = await supabase
      .from("work_schedules")
      .upsert({
        user_id: userId,
        working_days: workingDays,
        ...templateHours
      }, {
        onConflict: "user_id"
      })
      .select()
      .single();

    if (error) {
      console.error("Error upserting work schedule template:", error);
      throw error;
    }

    console.log(`Work schedule template upserted successfully:`, data);
    return data;
  } catch (error) {
    console.error("Error in upsertWorkScheduleTemplate:", error);
    throw error;
  }
};

export const upsertWorkSchedule = async (userId: string, workingDays: number): Promise<WorkSchedule | null> => {
  try {
    console.log(`Upserting work schedule for user ${userId}: ${workingDays} days`);
    
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    const { data, error } = await supabase
      .from("work_schedules")
      .upsert({
        user_id: userId,
        working_days: workingDays
      }, {
        onConflict: "user_id"
      })
      .select()
      .single();

    if (error) {
      console.error("Error upserting work schedule:", error);
      throw error;
    }

    console.log(`Work schedule upserted successfully:`, data);
    return data;
  } catch (error) {
    console.error("Error in upsertWorkSchedule:", error);
    throw error;
  }
};

export const migrateLocalStorageToDatabase = async (userId: string): Promise<void> => {
  try {
    // Check if user already has a database record
    const existingSchedule = await fetchWorkSchedule(userId);
    if (existingSchedule) {
      console.log(`User ${userId} already has database work schedule, skipping migration`);
      return;
    }

    // Check for localStorage data
    const localStorageKey = `timesheet-working-days-${userId}`;
    const localData = localStorage.getItem(localStorageKey);
    
    if (localData && !isNaN(parseInt(localData))) {
      const workingDays = parseInt(localData);
      console.log(`Migrating localStorage data for user ${userId}: ${workingDays} days`);
      
      await upsertWorkSchedule(userId, workingDays);
      
      // Clean up localStorage after successful migration
      localStorage.removeItem(localStorageKey);
      console.log(`Migration completed and localStorage cleaned for user ${userId}`);
    } else {
      console.log(`No localStorage data found for user ${userId}, using employment type default`);
      const defaultDays = await getDefaultWorkingDays(userId);
      await upsertWorkSchedule(userId, defaultDays);
    }
  } catch (error) {
    console.error(`Error migrating localStorage to database for user ${userId}:`, error);
  }
};
