import { supabase } from "@/integrations/supabase/client";

export interface PayrollSettings {
  id: string;
  pay_frequency: string;
  pay_day: string;
  week_start_day: string;
  reference_pay_date: string;
  hours_per_leave_day: number;
  created_at?: string;
  updated_at?: string;
}

export interface PayPeriod {
  id: string;
  period_start: string;
  period_end: string;
  payroll_cutoff_date: string;
  payroll_date: string;
  status: string;
  processed_at?: string;
  processed_by?: string;
  created_at?: string;
}

export interface PayrollReportData {
  user_id: string;
  employee_id: string;
  full_name: string;
  scheduled_hours: number;
  actual_hours: number;
  leave_hours_pre_cutoff: number;
  leave_hours_post_cutoff: number;
  prior_period_adjustments: number;
  net_hours: number;
}

export const fetchPayrollSettings = async (): Promise<PayrollSettings | null> => {
  const { data, error } = await supabase
    .from("payroll_settings")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching payroll settings:", error);
    throw error;
  }

  return data;
};

export const updatePayrollSettings = async (
  settings: Partial<PayrollSettings>
): Promise<PayrollSettings> => {
  const { data, error } = await supabase
    .from("payroll_settings")
    .update(settings)
    .eq("id", settings.id!)
    .select()
    .single();

  if (error) {
    console.error("Error updating payroll settings:", error);
    throw error;
  }

  return data;
};

export const fetchPayPeriods = async (
  limit: number = 12
): Promise<PayPeriod[]> => {
  const { data, error } = await supabase
    .from("pay_periods")
    .select("*")
    .order("period_start", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching pay periods:", error);
    throw error;
  }

  return data || [];
};

export const getCurrentPayPeriod = async (): Promise<PayPeriod | null> => {
  const { data, error } = await supabase.rpc("get_current_pay_period");

  if (error) {
    console.error("Error fetching current pay period:", error);
    throw error;
  }

  return data && data.length > 0 ? data[0] : null;
};

export const getPayPeriodForDate = async (date: string): Promise<string | null> => {
  const { data, error } = await supabase.rpc("get_pay_period_for_date", {
    check_date: date,
  });

  if (error) {
    console.error("Error fetching pay period for date:", error);
    throw error;
  }

  return data;
};

export const isAfterPayrollCutoff = async (date: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc("is_after_payroll_cutoff", {
    check_date: date,
  });

  if (error) {
    console.error("Error checking payroll cutoff:", error);
    return false;
  }

  return data || false;
};

export const generatePayPeriods = async (
  startDate: string,
  numPeriods: number = 12
): Promise<number> => {
  const { data, error } = await supabase.rpc("generate_pay_periods", {
    p_start_date: startDate,
    p_num_periods: numPeriods,
  });

  if (error) {
    console.error("Error generating pay periods:", error);
    throw error;
  }

  return data || 0;
};

export const getPayrollReportData = async (
  payPeriodId: string
): Promise<PayrollReportData[]> => {
  const { data, error } = await supabase.rpc("get_payroll_report", {
    p_pay_period_id: payPeriodId,
  });

  if (error) {
    console.error("Error fetching payroll report:", error);
    throw error;
  }

  return data || [];
};
