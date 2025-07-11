import { supabase } from "@/integrations/supabase/client";

export interface TimesheetLockInfo {
  isLocked: boolean;
  lockReason: string | null;
  lockType: 'manual' | 'leave' | 'none';
  lockedUntil: string | null;
  canOverride: boolean;
}

export interface LeaveValidationResult {
  canLog: boolean;
  reason: string;
  isHoliday: boolean;
  isLeaveDay: boolean;
  isWeekend: boolean;
}

export class TimesheetIntegrationService {
  /**
   * Check if a date is locked for timesheet entries
   */
  static async checkDateLock(
    userId: string,
    entryDate: string
  ): Promise<TimesheetLockInfo> {
    try {
      // Get work schedule and lock information
      const { data: workSchedule, error } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching work schedule:', error);
        return {
          isLocked: false,
          lockReason: null,
          lockType: 'none',
          lockedUntil: null,
          canOverride: false,
        };
      }

      if (!workSchedule) {
        return {
          isLocked: false,
          lockReason: null,
          lockType: 'none',
          lockedUntil: null,
          canOverride: false,
        };
      }

      const entryDateObj = new Date(entryDate);
      const lockedUntilDate = workSchedule.locked_until_date ? new Date(workSchedule.locked_until_date) : null;

      const isLocked = lockedUntilDate && entryDateObj <= lockedUntilDate;

      if (!isLocked) {
        return {
          isLocked: false,
          lockReason: null,
          lockType: 'none',
          lockedUntil: null,
          canOverride: false,
        };
      }

      // Determine lock type based on reason
      const lockType = workSchedule.lock_reason?.includes('Leave Application') 
        ? 'leave' 
        : 'manual';

      // Check if user can override (admin only for most cases)
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const canOverride = userProfile?.role === 'admin';

      return {
        isLocked: true,
        lockReason: workSchedule.lock_reason,
        lockType,
        lockedUntil: workSchedule.locked_until_date,
        canOverride,
      };
    } catch (error) {
      console.error('Error in TimesheetIntegrationService.checkDateLock:', error);
      return {
        isLocked: false,
        lockReason: null,
        lockType: 'none',
        lockedUntil: null,
        canOverride: false,
      };
    }
  }

  /**
   * Validate if user can log time on a specific date
   */
  static async validateTimesheetEntry(
    userId: string,
    entryDate: string
  ): Promise<LeaveValidationResult> {
    try {
      // Check for locks first
      const lockInfo = await this.checkDateLock(userId, entryDate);
      
      if (lockInfo.isLocked && lockInfo.lockType === 'leave') {
        return {
          canLog: false,
          reason: 'This date is locked due to approved leave',
          isHoliday: false,
          isLeaveDay: true,
          isWeekend: false,
        };
      }

      // Check if it's a weekend
      const entryDateObj = new Date(entryDate);
      const isWeekend = entryDateObj.getDay() === 0 || entryDateObj.getDay() === 6;

      // Check work schedule preferences
      const { data: workSchedule } = await supabase
        .from('work_schedules')
        .select('allow_weekend_entries, allow_holiday_entries')
        .eq('user_id', userId)
        .single();

      if (isWeekend && !workSchedule?.allow_weekend_entries) {
        return {
          canLog: false,
          reason: 'Weekend entries are not allowed',
          isHoliday: false,
          isLeaveDay: false,
          isWeekend: true,
        };
      }

      // Check if it's a public holiday
      const { data: holidayCheck, error: holidayError } = await supabase.rpc(
        'check_user_holiday_permission',
        {
          p_user_id: userId,
          p_holiday_date: entryDate,
        }
      );

      if (holidayError) {
        console.error('Error checking holiday permission:', holidayError);
      }

      const holidayResult = holidayCheck?.[0];
      if (holidayResult && !holidayResult.is_allowed) {
        return {
          canLog: false,
          reason: holidayResult.message || 'Holiday entries are not allowed',
          isHoliday: true,
          isLeaveDay: false,
          isWeekend,
        };
      }

      // Check if there's manual lock
      if (lockInfo.isLocked && lockInfo.lockType === 'manual') {
        return {
          canLog: false,
          reason: lockInfo.lockReason || 'This date is manually locked',
          isHoliday: holidayResult?.holiday_name ? true : false,
          isLeaveDay: false,
          isWeekend,
        };
      }

      return {
        canLog: true,
        reason: 'Entry allowed',
        isHoliday: holidayResult?.holiday_name ? true : false,
        isLeaveDay: false,
        isWeekend,
      };
    } catch (error) {
      console.error('Error in TimesheetIntegrationService.validateTimesheetEntry:', error);
      return {
        canLog: false,
        reason: 'Error validating entry',
        isHoliday: false,
        isLeaveDay: false,
        isWeekend: false,
      };
    }
  }

  /**
   * Lock dates for approved leave
   */
  static async lockLeaveDates(
    userId: string,
    startDate: string,
    endDate: string,
    applicationId: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('lock_leave_dates', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_application_id: applicationId,
      });

      if (error) {
        console.error('Error locking leave dates:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in TimesheetIntegrationService.lockLeaveDates:', error);
      throw error;
    }
  }

  /**
   * Unlock dates when leave is cancelled/rejected
   */
  static async unlockLeaveDates(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('unlock_leave_dates', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) {
        console.error('Error unlocking leave dates:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in TimesheetIntegrationService.unlockLeaveDates:', error);
      throw error;
    }
  }

  /**
   * Check if there are existing timesheet entries on leave dates
   */
  static async checkExistingEntries(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    hasEntries: boolean;
    entriesCount: number;
    conflictDates: string[];
  }> {
    try {
      const { data: entries, error } = await supabase
        .from('timesheet_entries')
        .select('entry_date, hours_logged')
        .eq('user_id', userId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

      if (error) {
        console.error('Error checking existing entries:', error);
        throw error;
      }

      const conflictDates = entries?.map(entry => entry.entry_date) || [];

      return {
        hasEntries: (entries?.length || 0) > 0,
        entriesCount: entries?.length || 0,
        conflictDates,
      };
    } catch (error) {
      console.error('Error in TimesheetIntegrationService.checkExistingEntries:', error);
      return {
        hasEntries: false,
        entriesCount: 0,
        conflictDates: [],
      };
    }
  }

  /**
   * Get lock status for multiple dates
   */
  static async getLockStatusForDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, TimesheetLockInfo>> {
    try {
      const result: Record<string, TimesheetLockInfo> = {};
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        result[dateStr] = await this.checkDateLock(userId, dateStr);
      }

      return result;
    } catch (error) {
      console.error('Error in TimesheetIntegrationService.getLockStatusForDateRange:', error);
      return {};
    }
  }

  /**
   * Enhanced lock reason formatting
   */
  static formatLockReason(lockReason: string | null, lockType: 'manual' | 'leave' | 'none'): string {
    if (!lockReason) {
      return 'Date is locked';
    }

    if (lockType === 'leave') {
      // Extract application ID if present
      const match = lockReason.match(/Leave Application \(ID: ([^)]+)\)/);
      if (match) {
        return `Locked due to approved leave (Application: ${match[1]})`;
      }
      return 'Locked due to approved leave';
    }

    return lockReason;
  }

  /**
   * Manual lock management
   */
  static async setManualLock(
    userId: string,
    lockUntilDate: string,
    reason: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('work_schedules')
        .update({
          locked_until_date: lockUntilDate,
          lock_reason: reason,
          locked_at: new Date().toISOString(),
          locked_by: userId,
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error setting manual lock:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in TimesheetIntegrationService.setManualLock:', error);
      throw error;
    }
  }

  /**
   * Remove manual lock
   */
  static async removeManualLock(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('work_schedules')
        .update({
          locked_until_date: null,
          lock_reason: null,
          locked_at: null,
          locked_by: null,
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing manual lock:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in TimesheetIntegrationService.removeManualLock:', error);
      throw error;
    }
  }
}