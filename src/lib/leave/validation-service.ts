import { supabase } from "@/integrations/supabase/client";

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Check if there are overlapping leave applications for a user
 */
export async function validateNoOverlappingLeave(
  userId: string,
  startDate: string,
  endDate: string,
  excludeApplicationId?: string
): Promise<ValidationResult> {
  try {
    let query = supabase
      .from("leave_applications")
      .select("id, start_date, end_date, status, leave_types(name)")
      .eq("user_id", userId)
      .in("status", ["pending", "approved"])
      .or(
        `and(start_date.lte.${endDate},end_date.gte.${startDate})`
      );

    if (excludeApplicationId) {
      query = query.neq("id", excludeApplicationId);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (data && data.length > 0) {
      const overlapping = data[0];
      return {
        isValid: false,
        message: `You have an overlapping ${overlapping.status} leave application from ${new Date(overlapping.start_date).toLocaleDateString()} to ${new Date(overlapping.end_date).toLocaleDateString()}`,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error validating overlapping leave:", error);
    return {
      isValid: false,
      message: "Failed to validate leave dates. Please try again.",
    };
  }
}

/**
 * Check if the user has sufficient leave balance
 */
export async function validateSufficientBalance(
  userId: string,
  leaveTypeId: string,
  requestedDays: number,
  year?: number
): Promise<ValidationResult> {
  try {
    const currentYear = year || new Date().getFullYear();

    const { data, error } = await supabase
      .from("leave_balances")
      .select("*, leave_types(name)")
      .eq("user_id", userId)
      .eq("leave_type_id", leaveTypeId)
      .eq("year", currentYear)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return {
          isValid: false,
          message: "No leave balance found for this leave type",
        };
      }
      throw error;
    }

    const available = data.total_days - data.used_days;

    if (requestedDays > available) {
      return {
        isValid: false,
        message: `Insufficient ${data.leave_types?.name} balance. You have ${available} days available but requested ${requestedDays} days.`,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error validating balance:", error);
    return {
      isValid: false,
      message: "Failed to validate leave balance. Please try again.",
    };
  }
}

/**
 * Check if dates fall on weekends or holidays
 */
export async function validateBusinessDays(
  startDate: string,
  endDate: string
): Promise<ValidationResult> {
  try {
    // Check if any dates in the range are weekends
    const start = new Date(startDate);
    const end = new Date(endDate);
    let hasWeekend = false;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day === 0 || day === 6) {
        hasWeekend = true;
        break;
      }
    }

    if (hasWeekend) {
      return {
        isValid: false,
        message: "Leave dates include weekends. Please select only business days.",
      };
    }

    // Check for public holidays
    const { data: holidays, error } = await supabase
      .from("public_holidays")
      .select("date, name")
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) throw error;

    if (holidays && holidays.length > 0) {
      const holidayNames = holidays.map((h) => h.name).join(", ");
      return {
        isValid: false,
        message: `Leave dates include public holiday(s): ${holidayNames}. Please exclude these dates.`,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error validating business days:", error);
    return {
      isValid: false,
      message: "Failed to validate dates. Please try again.",
    };
  }
}

/**
 * Check if dates are not in the past (backdated)
 */
export function validateNotBackdated(startDate: string): ValidationResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);

  if (start < today) {
    return {
      isValid: false,
      message: "Cannot apply for leave with past dates. Please select future dates.",
    };
  }

  return { isValid: true };
}

/**
 * Validate minimum notice period (e.g., 2 days in advance)
 */
export function validateNoticePeriod(
  startDate: string,
  minDaysNotice: number = 2
): ValidationResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const daysDifference = Math.floor(
    (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDifference < minDaysNotice) {
    return {
      isValid: false,
      message: `Leave applications require at least ${minDaysNotice} days notice. Please select a date at least ${minDaysNotice} days in the future.`,
    };
  }

  return { isValid: true };
}

/**
 * Comprehensive validation for leave applications
 */
export async function validateLeaveApplication(
  userId: string,
  leaveTypeId: string,
  startDate: string,
  endDate: string,
  businessDays: number,
  options?: {
    excludeApplicationId?: string;
    skipBalanceCheck?: boolean;
    skipWeekendCheck?: boolean;
    skipBackdateCheck?: boolean;
    skipNoticeCheck?: boolean;
    minDaysNotice?: number;
  }
): Promise<ValidationResult> {
  // Validate not backdated
  if (!options?.skipBackdateCheck) {
    const backdateCheck = validateNotBackdated(startDate);
    if (!backdateCheck.isValid) return backdateCheck;
  }

  // Validate notice period
  if (!options?.skipNoticeCheck) {
    const noticeCheck = validateNoticePeriod(startDate, options?.minDaysNotice);
    if (!noticeCheck.isValid) return noticeCheck;
  }

  // Validate no overlapping leave
  const overlapCheck = await validateNoOverlappingLeave(
    userId,
    startDate,
    endDate,
    options?.excludeApplicationId
  );
  if (!overlapCheck.isValid) return overlapCheck;

  // Validate weekends/holidays
  if (!options?.skipWeekendCheck) {
    const businessDayCheck = await validateBusinessDays(startDate, endDate);
    if (!businessDayCheck.isValid) return businessDayCheck;
  }

  // Validate sufficient balance
  if (!options?.skipBalanceCheck) {
    const balanceCheck = await validateSufficientBalance(
      userId,
      leaveTypeId,
      businessDays
    );
    if (!balanceCheck.isValid) return balanceCheck;
  }

  return { isValid: true };
}
