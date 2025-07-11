import { supabase } from "@/integrations/supabase/client";

export interface LeaveUsageAnalytics {
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
  totalDaysRequested: number;
  totalDaysApproved: number;
  averageDaysPerApplication: number;
  mostPopularLeaveType: string;
  peakUsageMonths: string[];
}

export interface LeaveBalanceAnalytics {
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
  utilizationRate: number;
  byLeaveType: Array<{
    leaveType: string;
    allocated: number;
    used: number;
    remaining: number;
    utilizationRate: number;
  }>;
}

export interface LeaveTrend {
  period: string;
  applications: number;
  daysRequested: number;
  daysApproved: number;
  approvalRate: number;
}

export class LeaveAnalyticsService {
  /**
   * Get leave usage analytics for a date range
   */
  static async getLeaveUsageAnalytics(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<LeaveUsageAnalytics> {
    try {
      let query = supabase
        .from('leave_applications')
        .select(`
          *,
          leave_type:leave_types(name)
        `)
        .gte('start_date', startDate)
        .lte('end_date', endDate);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching leave analytics:', error);
        throw error;
      }

      const applications = data || [];
      const approved = applications.filter(app => app.status === 'approved');
      const rejected = applications.filter(app => app.status === 'rejected');
      const pending = applications.filter(app => app.status === 'pending');

      const totalDaysRequested = applications.reduce((sum, app) => sum + app.business_days_count, 0);
      const totalDaysApproved = approved.reduce((sum, app) => sum + app.business_days_count, 0);

      // Find most popular leave type
      const leaveTypeCounts = applications.reduce((acc, app) => {
        const typeName = app.leave_type?.name || 'Unknown';
        acc[typeName] = (acc[typeName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostPopularLeaveType = Object.entries(leaveTypeCounts)
        .sort(([,a], [,b]) => Number(b) - Number(a))[0]?.[0] || 'None';

      // Find peak usage months
      const monthCounts = applications.reduce((acc, app) => {
        const month = new Date(app.start_date).toLocaleString('default', { month: 'long' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const peakUsageMonths = Object.entries(monthCounts)
        .sort(([,a], [,b]) => Number(b) - Number(a))
        .slice(0, 3)
        .map(([month]) => month);

      return {
        totalApplications: applications.length,
        approvedApplications: approved.length,
        rejectedApplications: rejected.length,
        pendingApplications: pending.length,
        totalDaysRequested,
        totalDaysApproved,
        averageDaysPerApplication: applications.length > 0 ? totalDaysRequested / applications.length : 0,
        mostPopularLeaveType,
        peakUsageMonths
      };
    } catch (error) {
      console.error('Error in LeaveAnalyticsService.getLeaveUsageAnalytics:', error);
      throw error;
    }
  }

  /**
   * Get leave balance analytics for current year
   */
  static async getLeaveBalanceAnalytics(
    year?: number,
    userId?: string
  ): Promise<LeaveBalanceAnalytics> {
    try {
      const targetYear = year || new Date().getFullYear();

      let query = supabase
        .from('leave_balances')
        .select(`
          *,
          leave_type:leave_types(name)
        `)
        .eq('year', targetYear);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching balance analytics:', error);
        throw error;
      }

      const balances = data || [];
      
      const totalAllocated = balances.reduce((sum, balance) => sum + Number(balance.total_days), 0);
      const totalUsed = balances.reduce((sum, balance) => sum + Number(balance.used_days), 0);
      const totalRemaining = totalAllocated - totalUsed;
      const utilizationRate = totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;

      // Group by leave type
      const byLeaveType = balances.reduce((acc, balance) => {
        const typeName = balance.leave_type?.name || 'Unknown';
        const existing = acc.find(item => item.leaveType === typeName);
        
        if (existing) {
          existing.allocated += Number(balance.total_days);
          existing.used += Number(balance.used_days);
          existing.remaining += (Number(balance.total_days) - Number(balance.used_days));
        } else {
          acc.push({
            leaveType: typeName,
            allocated: Number(balance.total_days),
            used: Number(balance.used_days),
            remaining: Number(balance.total_days) - Number(balance.used_days),
            utilizationRate: Number(balance.total_days) > 0 ? (Number(balance.used_days) / Number(balance.total_days)) * 100 : 0
          });
        }
        
        return acc;
      }, [] as any[]);

      // Update utilization rates for grouped data
      byLeaveType.forEach(item => {
        item.utilizationRate = item.allocated > 0 ? (item.used / item.allocated) * 100 : 0;
      });

      return {
        totalAllocated,
        totalUsed,
        totalRemaining,
        utilizationRate,
        byLeaveType
      };
    } catch (error) {
      console.error('Error in LeaveAnalyticsService.getLeaveBalanceAnalytics:', error);
      throw error;
    }
  }

  /**
   * Get leave trends over time
   */
  static async getLeaveTrends(
    startDate: string,
    endDate: string,
    groupBy: 'month' | 'quarter' = 'month'
  ): Promise<LeaveTrend[]> {
    try {
      const { data, error } = await supabase
        .from('leave_applications')
        .select('*')
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .order('start_date');

      if (error) {
        console.error('Error fetching leave trends:', error);
        throw error;
      }

      const applications = data || [];
      
      // Group applications by period
      const periods = applications.reduce((acc, app) => {
        const date = new Date(app.start_date);
        let periodKey: string;
        
        if (groupBy === 'month') {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          periodKey = `${date.getFullYear()}-Q${quarter}`;
        }

        if (!acc[periodKey]) {
          acc[periodKey] = {
            period: periodKey,
            applications: 0,
            daysRequested: 0,
            daysApproved: 0,
            totalApps: 0
          };
        }

        acc[periodKey].applications += 1;
        acc[periodKey].totalApps += 1;
        acc[periodKey].daysRequested += app.business_days_count;
        
        if (app.status === 'approved') {
          acc[periodKey].daysApproved += app.business_days_count;
        }

        return acc;
      }, {} as Record<string, any>);

      // Convert to array and calculate approval rates
      return Object.values(periods).map((period: any) => ({
        period: period.period,
        applications: period.applications,
        daysRequested: period.daysRequested,
        daysApproved: period.daysApproved,
        approvalRate: period.applications > 0 ? (period.daysApproved / period.daysRequested) * 100 : 0
      }));
    } catch (error) {
      console.error('Error in LeaveAnalyticsService.getLeaveTrends:', error);
      throw error;
    }
  }

  /**
   * Get team leave calendar data
   */
  static async getTeamLeaveCalendar(
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('leave_applications')
        .select(`
          *,
          user:profiles!leave_applications_user_id_fkey(full_name, email),
          leave_type:leave_types(name)
        `)
        .eq('status', 'approved')
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .order('start_date');

      if (error) {
        console.error('Error fetching team calendar:', error);
        throw error;
      }

      return (data || []).map(app => ({
        id: app.id,
        title: `${app.user?.full_name || app.user?.email} - ${app.leave_type?.name}`,
        start: app.start_date,
        end: app.end_date,
        userId: app.user_id,
        userName: app.user?.full_name || app.user?.email,
        leaveType: app.leave_type?.name,
        businessDays: app.business_days_count,
        reason: app.reason
      }));
    } catch (error) {
      console.error('Error in LeaveAnalyticsService.getTeamLeaveCalendar:', error);
      throw error;
    }
  }
}