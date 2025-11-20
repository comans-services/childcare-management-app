import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type LeaveApplication = Database["public"]["Tables"]["leave_applications"]["Row"];
type LeaveBalance = Database["public"]["Tables"]["leave_balances"]["Row"];

export interface LeaveReportFilters {
  startDate: Date;
  endDate: Date;
  userIds?: string[];
  status?: string[];
}

export interface LeaveReportData {
  applications: LeaveApplication[];
  balances: LeaveBalance[];
}

export const fetchLeaveReportData = async (
  filters: LeaveReportFilters
): Promise<LeaveReportData> => {
  try {
    // Fetch leave applications with filters
    let applicationsQuery = supabase
      .from("leave_applications")
      .select(`
        *,
        profiles!fk_leave_applications_user(full_name, email, employment_type),
        leave_types(name, description)
      `)
      .gte("start_date", filters.startDate.toISOString())
      .lte("end_date", filters.endDate.toISOString())
      .order("start_date", { ascending: false });

    if (filters.userIds && filters.userIds.length > 0) {
      applicationsQuery = applicationsQuery.in("user_id", filters.userIds);
    }

    if (filters.status && filters.status.length > 0) {
      applicationsQuery = applicationsQuery.in("status", filters.status as any);
    }

    const { data: applications, error: appError } = await applicationsQuery;

    if (appError) throw appError;

    // Fetch leave balances
    let balancesQuery = supabase
      .from("leave_balances")
      .select(`
        *,
        profiles!fk_leave_balances_user(full_name, email),
        leave_types(name)
      `)
      .eq("year", new Date().getFullYear());

    if (filters.userIds && filters.userIds.length > 0) {
      balancesQuery = balancesQuery.in("user_id", filters.userIds);
    }

    const { data: balances, error: balError } = await balancesQuery;

    if (balError) throw balError;

    return {
      applications: applications || [],
      balances: balances || [],
    };
  } catch (error) {
    console.error("Error fetching leave report data:", error);
    throw error;
  }
};
