import { supabase } from "@/integrations/supabase/client";
import { LeaveBalance, LeaveType } from "@/lib/leave-service";

export interface CreateLeaveBalanceData {
  user_id: string;
  leave_type_id: string;
  year?: number;
  total_days: number;
}

export interface UpdateLeaveBalanceData {
  total_days?: number;
  used_days?: number;
}

export class LeaveBalanceService {
  /**
   * Create leave balances for a user
   */
  static async createUserBalances(
    userId: string,
    year: number = new Date().getFullYear()
  ): Promise<LeaveBalance[]> {
    try {
      // First check if user is full-time
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('employment_type')
        .eq('id', userId)
        .single();

      if (userProfile?.employment_type !== 'full-time') {
        throw new Error('Leave balances are only available for full-time employees');
      }

      // Get all active leave types
      const { data: leaveTypes, error: leaveTypesError } = await supabase
        .from('leave_types')
        .select('*')
        .eq('is_active', true);

      if (leaveTypesError) {
        console.error('Error fetching leave types:', leaveTypesError);
        throw leaveTypesError;
      }

      if (!leaveTypes?.length) {
        throw new Error('No active leave types found');
      }

      // Create balances for each leave type
      const balancePromises = leaveTypes.map(async (leaveType) => {
        const { data, error } = await supabase
          .from('leave_balances')
          .upsert({
            user_id: userId,
            leave_type_id: leaveType.id,
            year,
            total_days: leaveType.default_balance_days,
            used_days: 0,
          })
          .select(`
            *,
            leave_type:leave_types(*),
            user:profiles!leave_balances_user_id_fkey(full_name, email, employment_type)
          `)
          .single();

        if (error) {
          console.error('Error creating leave balance:', error);
          throw error;
        }

        return data;
      });

      const balances = await Promise.all(balancePromises);
      
      // Send notification about balance updates
      try {
        await this.notifyUserOfBalanceUpdate(userId, balances);
      } catch (notificationError) {
        console.warn('Failed to send balance notification:', notificationError);
      }

      return balances;
    } catch (error) {
      console.error('Error in LeaveBalanceService.createUserBalances:', error);
      throw error;
    }
  }

  /**
   * Fetch user leave balances with employment type filtering
   */
  static async fetchUserBalances(
    userId: string,
    year: number = new Date().getFullYear()
  ): Promise<LeaveBalance[]> {
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .select(`
          *,
          leave_type:leave_types(*),
          user:profiles!leave_balances_user_id_fkey(full_name, email, employment_type)
        `)
        .eq('user_id', userId)
        .eq('year', year)
        .order('created_at');

      if (error) {
        console.error('Error fetching user leave balances:', error);
        throw error;
      }

      // Filter for full-time employees only
      const filteredData = (data || []).filter(balance => 
        balance.user?.employment_type === 'full-time'
      );

      return filteredData;
    } catch (error) {
      console.error('Error in LeaveBalanceService.fetchUserBalances:', error);
      throw error;
    }
  }

  /**
   * Update leave balance
   */
  static async updateBalance(
    balanceId: string,
    updates: UpdateLeaveBalanceData
  ): Promise<LeaveBalance> {
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .update(updates)
        .eq('id', balanceId)
        .select(`
          *,
          leave_type:leave_types(*),
          user:profiles!leave_balances_user_id_fkey(full_name, email, employment_type)
        `)
        .single();

      if (error) {
        console.error('Error updating leave balance:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in LeaveBalanceService.updateBalance:', error);
      throw error;
    }
  }

  /**
   * Calculate remaining days and check validity
   */
  static calculateRemainingDays(balance: LeaveBalance): number {
    return Math.max(0, balance.total_days - balance.used_days);
  }

  /**
   * Check if user has sufficient leave balance
   */
  static async checkSufficientBalance(
    userId: string,
    leaveTypeId: string,
    requestedDays: number,
    year: number = new Date().getFullYear()
  ): Promise<{ sufficient: boolean; available: number; message: string }> {
    try {
      const { data: balance, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('leave_type_id', leaveTypeId)
        .eq('year', year)
        .single();

      if (error) {
        console.error('Error checking leave balance:', error);
        return {
          sufficient: false,
          available: 0,
          message: 'Unable to check leave balance',
        };
      }

      if (!balance) {
        return {
          sufficient: false,
          available: 0,
          message: 'No leave balance found for this leave type',
        };
      }

      const available = this.calculateRemainingDays(balance);
      const sufficient = available >= requestedDays;

      return {
        sufficient,
        available,
        message: sufficient
          ? 'Sufficient leave balance available'
          : `Insufficient leave balance. Available: ${available} days, Requested: ${requestedDays} days`,
      };
    } catch (error) {
      console.error('Error in LeaveBalanceService.checkSufficientBalance:', error);
      return {
        sufficient: false,
        available: 0,
        message: 'Error checking leave balance',
      };
    }
  }

  /**
   * Get balance summary for a user
   */
  static async getBalanceSummary(
    userId: string,
    year: number = new Date().getFullYear()
  ): Promise<{
    totalAllocated: number;
    totalUsed: number;
    totalRemaining: number;
    balancesByType: LeaveBalance[];
  }> {
    try {
      const balances = await this.fetchUserBalances(userId, year);

      const totalAllocated = balances.reduce((sum, balance) => sum + balance.total_days, 0);
      const totalUsed = balances.reduce((sum, balance) => sum + balance.used_days, 0);
      const totalRemaining = balances.reduce((sum, balance) => sum + this.calculateRemainingDays(balance), 0);

      return {
        totalAllocated,
        totalUsed,
        totalRemaining,
        balancesByType: balances,
      };
    } catch (error) {
      console.error('Error in LeaveBalanceService.getBalanceSummary:', error);
      throw error;
    }
  }

  /**
   * Bulk update balances for multiple users
   */
  static async bulkUpdateBalances(
    updates: Array<{
      userId: string;
      leaveTypeId: string;
      totalDays: number;
      year?: number;
    }>
  ): Promise<void> {
    try {
      const year = new Date().getFullYear();
      
      const updatePromises = updates.map(async (update) => {
        const { data, error } = await supabase
          .from('leave_balances')
          .upsert({
            user_id: update.userId,
            leave_type_id: update.leaveTypeId,
            year: update.year || year,
            total_days: update.totalDays,
          });

        if (error) {
          console.error('Error in bulk update:', error);
          throw error;
        }

        return data;
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error in LeaveBalanceService.bulkUpdateBalances:', error);
      throw error;
    }
  }

  /**
   * Send notification to user about balance updates
   */
  private static async notifyUserOfBalanceUpdate(
    userId: string,
    balances: LeaveBalance[]
  ): Promise<void> {
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      if (!userProfile?.email) {
        console.warn('No email found for user:', userId);
        return;
      }

      await supabase.functions.invoke('send-hr-email', {
        body: {
          type: 'balance_update',
          data: {
            user_email: userProfile.email,
            user_name: userProfile.full_name,
            balances: balances.map(balance => ({
              leave_type: balance.leave_type?.name,
              total_days: balance.total_days,
              used_days: balance.used_days,
              remaining_days: this.calculateRemainingDays(balance),
            })),
          },
        },
      });
    } catch (error) {
      console.error('Error sending balance notification:', error);
      throw error;
    }
  }
}