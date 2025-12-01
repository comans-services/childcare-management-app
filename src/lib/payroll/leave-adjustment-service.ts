import { supabase } from "@/integrations/supabase/client";

export interface LeaveAdjustment {
  id: string;
  user_id: string;
  leave_application_id?: string;
  original_pay_period_id?: string;
  target_pay_period_id?: string;
  leave_date: string;
  hours_to_deduct: number;
  reason?: string;
  status: string;
  applied_at?: string;
  created_at?: string;
}

export const fetchPendingAdjustments = async (
  userId?: string,
  payPeriodId?: string
): Promise<LeaveAdjustment[]> => {
  let query = supabase
    .from("leave_adjustments")
    .select("*")
    .eq("status", "pending");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (payPeriodId) {
    query = query.eq("target_pay_period_id", payPeriodId);
  }

  const { data, error } = await query.order("leave_date", { ascending: true });

  if (error) {
    console.error("Error fetching pending adjustments:", error);
    throw error;
  }

  return data || [];
};

export const getPreviousPeriodAdjustments = async (
  payPeriodId: string
): Promise<LeaveAdjustment[]> => {
  const { data, error } = await supabase
    .from("leave_adjustments")
    .select("*")
    .eq("target_pay_period_id", payPeriodId)
    .eq("status", "pending")
    .order("leave_date", { ascending: true });

  if (error) {
    console.error("Error fetching previous period adjustments:", error);
    throw error;
  }

  return data || [];
};

export const applyAdjustments = async (payPeriodId: string): Promise<void> => {
  const { error } = await supabase
    .from("leave_adjustments")
    .update({ status: "applied", applied_at: new Date().toISOString() })
    .eq("target_pay_period_id", payPeriodId)
    .eq("status", "pending");

  if (error) {
    console.error("Error applying adjustments:", error);
    throw error;
  }
};

export const createLeaveAdjustment = async (
  adjustment: Omit<LeaveAdjustment, "id" | "created_at">
): Promise<LeaveAdjustment> => {
  const { data, error } = await supabase
    .from("leave_adjustments")
    .insert(adjustment)
    .select()
    .single();

  if (error) {
    console.error("Error creating leave adjustment:", error);
    throw error;
  }

  return data;
};
