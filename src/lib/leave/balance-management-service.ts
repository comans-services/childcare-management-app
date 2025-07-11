import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface LeaveBalanceAdjustment {
  userId: string;
  leaveTypeId: string;
  year: number;
  adjustmentType: 'increase' | 'decrease' | 'set';
  amount: number;
  reason: string;
}

export interface CarryOverRules {
  leaveTypeId: string;
  maxCarryOver: number;
  expiryMonths: number; // months after year-end when carry-over expires
  requiresApproval: boolean;
}

export interface AnnualResetSettings {
  resetDate: string; // MM-DD format
  carryOverRules: CarryOverRules[];
  notificationDays: number; // days before reset to notify users
}

export class LeaveBalanceManagementService {
  
  /**
   * Get current leave balances for a user
   */
  static async getUserBalances(userId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        leave_types (
          id,
          name,
          default_balance_days,
          requires_attachment
        )
      `)
      .eq('user_id', userId)
      .eq('year', targetYear);

    if (error) throw error;
    return data;
  }

  /**
   * Get all users' balances for admin view
   */
  static async getAllUserBalances(year?: number) {
    const targetYear = year || new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        profiles!user_id (
          id,
          full_name,
          email,
          employment_type
        ),
        leave_types (
          id,
          name,
          default_balance_days
        )
      `)
      .eq('year', targetYear)
      .order('user_id');

    if (error) throw error;
    return data;
  }

  /**
   * Adjust leave balance (admin only)
   */
  static async adjustBalance(adjustment: LeaveBalanceAdjustment) {
    const { userId, leaveTypeId, year, adjustmentType, amount, reason } = adjustment;

    // Get current balance
    const { data: currentBalance, error: fetchError } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .eq('leave_type_id', leaveTypeId)
      .eq('year', year)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let newTotalDays: number;
    
    if (!currentBalance) {
      // Create new balance record
      const { data: leaveType } = await supabase
        .from('leave_types')
        .select('default_balance_days')
        .eq('id', leaveTypeId)
        .single();

      newTotalDays = adjustmentType === 'set' ? amount : (leaveType?.default_balance_days || 0) + 
        (adjustmentType === 'increase' ? amount : -amount);
    } else {
      newTotalDays = adjustmentType === 'set' ? amount : 
        currentBalance.total_days + (adjustmentType === 'increase' ? amount : -amount);
    }

    // Ensure non-negative balance
    newTotalDays = Math.max(0, newTotalDays);

    const balanceData = {
      user_id: userId,
      leave_type_id: leaveTypeId,
      year,
      total_days: newTotalDays,
      used_days: currentBalance?.used_days || 0,
    };

    const { error: upsertError } = await supabase
      .from('leave_balances')
      .upsert(balanceData, {
        onConflict: 'user_id,leave_type_id,year'
      });

    if (upsertError) throw upsertError;

    // Log the adjustment in audit trail
    await this.logBalanceAdjustment(userId, leaveTypeId, year, adjustmentType, amount, reason);
  }

  /**
   * Initialize balances for new year
   */
  static async initializeYearBalances(year: number) {
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, employment_type');

    if (usersError) throw usersError;

    const { data: leaveTypes, error: typesError } = await supabase
      .from('leave_types')
      .select('*')
      .eq('is_active', true);

    if (typesError) throw typesError;

    const balanceInserts = [];

    for (const user of users) {
      for (const leaveType of leaveTypes) {
        // Check if balance already exists
        const { data: existing } = await supabase
          .from('leave_balances')
          .select('id')
          .eq('user_id', user.id)
          .eq('leave_type_id', leaveType.id)
          .eq('year', year)
          .maybeSingle();

        if (!existing) {
          balanceInserts.push({
            user_id: user.id,
            leave_type_id: leaveType.id,
            year,
            total_days: leaveType.default_balance_days,
            used_days: 0,
          });
        }
      }
    }

    if (balanceInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('leave_balances')
        .insert(balanceInserts);

      if (insertError) throw insertError;
    }

    return balanceInserts.length;
  }

  /**
   * Process carry-over for year-end
   */
  static async processCarryOver(fromYear: number, toYear: number, rules: CarryOverRules[]) {
    for (const rule of rules) {
      const { data: balances, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('leave_type_id', rule.leaveTypeId)
        .eq('year', fromYear);

      if (error) throw error;

      for (const balance of balances) {
        const remainingDays = balance.total_days - balance.used_days;
        const carryOverDays = Math.min(remainingDays, rule.maxCarryOver);

        if (carryOverDays > 0) {
          // Add carry-over to next year's balance
          const { error: upsertError } = await supabase
            .from('leave_balances')
            .upsert({
              user_id: balance.user_id,
              leave_type_id: rule.leaveTypeId,
              year: toYear,
              total_days: carryOverDays, // This will be added to default allocation
              used_days: 0,
            }, {
              onConflict: 'user_id,leave_type_id,year'
            });

          if (upsertError) throw upsertError;

          // Log carry-over
          await this.logBalanceAdjustment(
            balance.user_id,
            rule.leaveTypeId,
            toYear,
            'increase',
            carryOverDays,
            `Carry-over from ${fromYear}`
          );
        }
      }
    }
  }

  /**
   * Get leave usage analytics
   */
  static async getLeaveAnalytics(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('leave_applications')
      .select(`
        *,
        leave_types (name),
        profiles!user_id (full_name, employment_type)
      `)
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .eq('status', 'approved');

    if (error) throw error;

    // Process analytics
    const analytics = {
      totalApplications: data.length,
      totalDaysUsed: data.reduce((sum, app) => sum + app.business_days_count, 0),
      byLeaveType: {} as Record<string, number>,
      byMonth: {} as Record<string, number>,
      byEmploymentType: {} as Record<string, number>,
      averageDaysPerUser: 0,
    };

    // Group by leave type
    data.forEach(app => {
      const typeName = app.leave_types?.name || 'Unknown';
      analytics.byLeaveType[typeName] = (analytics.byLeaveType[typeName] || 0) + app.business_days_count;
    });

    // Group by month
    data.forEach(app => {
      const month = new Date(app.start_date).toISOString().substring(0, 7);
      analytics.byMonth[month] = (analytics.byMonth[month] || 0) + app.business_days_count;
    });

    // Group by employment type
    data.forEach(app => {
      const empType = app.profiles?.employment_type || 'Unknown';
      analytics.byEmploymentType[empType] = (analytics.byEmploymentType[empType] || 0) + app.business_days_count;
    });

    // Calculate average days per user
    const uniqueUsers = new Set(data.map(app => app.user_id));
    analytics.averageDaysPerUser = uniqueUsers.size > 0 ? analytics.totalDaysUsed / uniqueUsers.size : 0;

    return analytics;
  }

  /**
   * Get team leave calendar data
   */
  static async getTeamLeaveCalendar(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('leave_applications')
      .select(`
        *,
        leave_types (name, id),
        profiles!user_id (full_name, email)
      `)
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .eq('status', 'approved')
      .order('start_date');

    if (error) throw error;

    return data.map(app => ({
      id: app.id,
      title: `${app.profiles?.full_name} - ${app.leave_types?.name}`,
      start: app.start_date,
      end: app.end_date,
      userId: app.user_id,
      leaveTypeId: app.leave_type_id,
      reason: app.reason,
      businessDays: app.business_days_count,
    }));
  }

  /**
   * Log balance adjustment for audit trail
   */
  private static async logBalanceAdjustment(
    userId: string, 
    leaveTypeId: string, 
    year: number, 
    adjustmentType: string, 
    amount: number, 
    reason: string
  ) {
    try {
      await supabase.rpc('log_leave_balance_audit', {
        p_user_id: userId,
        p_leave_type_id: leaveTypeId,
        p_year: year,
        p_adjustment_type: adjustmentType,
        p_amount: amount,
        p_reason: reason
      });
    } catch (error) {
      console.error('Failed to log balance adjustment:', error);
    }
  }
}