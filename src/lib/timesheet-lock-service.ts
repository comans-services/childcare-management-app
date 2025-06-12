
import { supabase } from "@/integrations/supabase/client";

export interface TimesheetLock {
  id: string;
  user_id: string;
  locked_until_date: string;
  lock_reason?: string;
  locked_at?: string;
  locked_by?: string;
  working_days: number;
  allow_weekend_entries: boolean;
}

export interface GlobalLockStatus {
  total_users_locked: number;
  earliest_lock_date: string | null;
  latest_lock_date: string | null;
  most_common_reason: string | null;
}

export const checkIfDateLocked = async (userId: string, entryDate: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_date_locked_for_user', {
      p_user_id: userId,
      entry_date: entryDate
    });

    if (error) {
      console.error("Error checking if date is locked:", error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error("Error in checkIfDateLocked:", error);
    return false;
  }
};

export const getUserLockStatus = async (userId: string): Promise<TimesheetLock | null> => {
  try {
    const { data, error } = await supabase
      .from("work_schedules")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user lock status:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getUserLockStatus:", error);
    return null;
  }
};

export const lockUserTimesheet = async (
  userId: string, 
  lockedUntilDate: string, 
  reason?: string
): Promise<TimesheetLock | null> => {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    const { data, error } = await supabase
      .from("work_schedules")
      .update({
        locked_until_date: lockedUntilDate,
        lock_reason: reason,
        locked_at: new Date().toISOString(),
        locked_by: currentUser.id,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error locking user timesheet:", error);
      throw error;
    }

    console.log(`Timesheet locked for user ${userId} until ${lockedUntilDate}`);
    return data;
  } catch (error) {
    console.error("Error in lockUserTimesheet:", error);
    throw error;
  }
};

export const unlockUserTimesheet = async (userId: string): Promise<TimesheetLock | null> => {
  try {
    const { data, error } = await supabase
      .from("work_schedules")
      .update({
        locked_until_date: null,
        lock_reason: null,
        locked_at: null,
        locked_by: null,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error unlocking user timesheet:", error);
      throw error;
    }

    console.log(`Timesheet unlocked for user ${userId}`);
    return data;
  } catch (error) {
    console.error("Error in unlockUserTimesheet:", error);
    throw error;
  }
};

export const getGlobalLockStatus = async (): Promise<GlobalLockStatus> => {
  try {
    const { data, error } = await supabase.rpc('get_global_lock_status');

    if (error) {
      console.error("Error fetching global lock status:", error);
      return {
        total_users_locked: 0,
        earliest_lock_date: null,
        latest_lock_date: null,
        most_common_reason: null
      };
    }

    return data[0] || {
      total_users_locked: 0,
      earliest_lock_date: null,
      latest_lock_date: null,
      most_common_reason: null
    };
  } catch (error) {
    console.error("Error in getGlobalLockStatus:", error);
    return {
      total_users_locked: 0,
      earliest_lock_date: null,
      latest_lock_date: null,
      most_common_reason: null
    };
  }
};

export const bulkLockTimesheets = async (
  userIds: string[], 
  lockedUntilDate: string, 
  reason?: string
): Promise<boolean> => {
  try {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      throw new Error("No authenticated user");
    }

    const { error } = await supabase
      .from("work_schedules")
      .update({
        locked_until_date: lockedUntilDate,
        lock_reason: reason,
        locked_at: new Date().toISOString(),
        locked_by: currentUser.id,
        updated_at: new Date().toISOString()
      })
      .in("user_id", userIds);

    if (error) {
      console.error("Error bulk locking timesheets:", error);
      throw error;
    }

    console.log(`Bulk locked ${userIds.length} user timesheets until ${lockedUntilDate}`);
    return true;
  } catch (error) {
    console.error("Error in bulkLockTimesheets:", error);
    throw error;
  }
};

export const bulkUnlockTimesheets = async (userIds: string[]): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("work_schedules")
      .update({
        locked_until_date: null,
        lock_reason: null,
        locked_at: null,
        locked_by: null,
        updated_at: new Date().toISOString()
      })
      .in("user_id", userIds);

    if (error) {
      console.error("Error bulk unlocking timesheets:", error);
      throw error;
    }

    console.log(`Bulk unlocked ${userIds.length} user timesheets`);
    return true;
  } catch (error) {
    console.error("Error in bulkUnlockTimesheets:", error);
    throw error;
  }
};
