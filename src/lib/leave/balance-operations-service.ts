import { supabase } from "@/integrations/supabase/client";

export interface BalanceOperation {
  id: string;
  operation_type: 'annual_reset' | 'carry_over' | 'manual_adjustment';
  user_id: string;
  leave_type_id: string;
  year: number;
  amount: number;
  reason?: string;
  created_by?: string;
  created_at: string;
  details?: any;
  user?: {
    full_name: string;
    email: string;
  };
  leave_type?: {
    name: string;
  };
}

export interface AnnualResetResult {
  user_id: string;
  leave_type_id: string;
  old_remaining: number;
  carry_over: number;
  new_total: number;
}

export class BalanceOperationsService {
  /**
   * Perform annual reset for all users or specific user/leave type
   */
  static async performAnnualReset(
    year?: number,
    userId?: string,
    leaveTypeId?: string
  ): Promise<AnnualResetResult[]> {
    try {
      const { data, error } = await supabase.rpc('perform_annual_reset', {
        p_year: year,
        p_user_id: userId,
        p_leave_type_id: leaveTypeId
      });

      if (error) {
        console.error('Error performing annual reset:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in BalanceOperationsService.performAnnualReset:', error);
      throw error;
    }
  }

  /**
   * Get balance operations history
   */
  static async getOperationsHistory(
    userId?: string,
    year?: number,
    operationType?: string
  ): Promise<BalanceOperation[]> {
    try {
      let query = supabase
        .from('leave_balance_operations')
        .select(`
          *,
          user:profiles!leave_balance_operations_user_id_fkey(full_name, email),
          leave_type:leave_types(name)
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (year) {
        query = query.eq('year', year);
      }

      if (operationType) {
        query = query.eq('operation_type', operationType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching operations history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in BalanceOperationsService.getOperationsHistory:', error);
      throw error;
    }
  }

  /**
   * Log manual balance adjustment
   */
  static async logManualAdjustment(
    userId: string,
    leaveTypeId: string,
    year: number,
    adjustmentAmount: number,
    reason: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('leave_balance_operations')
        .insert({
          operation_type: 'manual_adjustment',
          user_id: userId,
          leave_type_id: leaveTypeId,
          year,
          amount: adjustmentAmount,
          reason,
          details: {
            adjustment_type: adjustmentAmount > 0 ? 'increase' : 'decrease',
            amount: Math.abs(adjustmentAmount)
          }
        });

      if (error) {
        console.error('Error logging manual adjustment:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in BalanceOperationsService.logManualAdjustment:', error);
      throw error;
    }
  }

  /**
   * Get annual reset preview (what would happen without actually executing)
   */
  static async getAnnualResetPreview(
    year?: number,
    userId?: string,
    leaveTypeId?: string
  ): Promise<any[]> {
    try {
      const previewYear = year || new Date().getFullYear() + 1;
      const currentYear = previewYear - 1;

      let query = supabase
        .from('leave_balances')
        .select(`
          *,
          user:profiles!leave_balances_user_id_fkey(full_name, email, employment_type),
          leave_type:leave_types(name, default_balance_days, max_carry_over_days)
        `)
        .eq('year', currentYear);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (leaveTypeId) {
        query = query.eq('leave_type_id', leaveTypeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reset preview:', error);
        throw error;
      }

      // Calculate preview data
      return (data || [])
        .filter(balance => balance.user?.employment_type === 'full-time')
        .map(balance => {
          const remainingDays = balance.total_days - balance.used_days;
          const carryOverDays = Math.min(
            remainingDays,
            balance.leave_type?.max_carry_over_days || 0
          );
          const newTotal = (balance.leave_type?.default_balance_days || 0) + carryOverDays;

          return {
            user_id: balance.user_id,
            user_name: balance.user?.full_name || balance.user?.email,
            leave_type_id: balance.leave_type_id,
            leave_type_name: balance.leave_type?.name,
            current_remaining: remainingDays,
            carry_over_days: carryOverDays,
            default_days: balance.leave_type?.default_balance_days || 0,
            new_total: newTotal,
            year: previewYear
          };
        });
    } catch (error) {
      console.error('Error in BalanceOperationsService.getAnnualResetPreview:', error);
      throw error;
    }
  }

  /**
   * Update leave type carry-over settings
   */
  static async updateCarryOverSettings(
    leaveTypeId: string,
    maxCarryOverDays: number,
    carryOverExpiryMonths: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('leave_types')
        .update({
          max_carry_over_days: maxCarryOverDays,
          carry_over_expiry_months: carryOverExpiryMonths
        })
        .eq('id', leaveTypeId);

      if (error) {
        console.error('Error updating carry-over settings:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in BalanceOperationsService.updateCarryOverSettings:', error);
      throw error;
    }
  }
}