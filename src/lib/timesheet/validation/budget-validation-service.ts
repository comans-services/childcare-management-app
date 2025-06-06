import { supabase } from "@/integrations/supabase/client";
import { Project } from "../types";

export interface BudgetValidationResult {
  isValid: boolean;
  message?: string;
  remainingHours: number;
  totalBudget: number;
  hoursUsed: number;
  isOverBudget: boolean;
  canOverride: boolean; // Whether admin can override
  usagePercentage: number; // Add missing property
}

export interface BudgetCheckOptions {
  projectId: string;
  hoursToAdd: number;
  existingEntryId?: string; // For updates, exclude this entry from calculations
  userId?: string; // For admin override checks
}

/**
 * Calculates the current hours used for a project
 */
export const getProjectHoursUsed = async (
  projectId: string, 
  excludeEntryId?: string
): Promise<number> => {
  try {
    console.log(`=== CALCULATING PROJECT HOURS USED ===`);
    console.log(`Project ID: ${projectId}`);
    console.log(`Exclude Entry ID: ${excludeEntryId || 'none'}`);

    let query = supabase
      .from("timesheet_entries")
      .select("hours_logged")
      .eq("project_id", projectId);

    // Exclude existing entry if updating
    if (excludeEntryId) {
      query = query.neq("id", excludeEntryId);
    }

    const { data, error } = await query;
      
    if (error) {
      console.error("Error fetching project hours:", error);
      throw error;
    }
    
    const totalHours = data?.reduce((sum, entry) => sum + Number(entry.hours_logged), 0) || 0;
    console.log(`Total hours used: ${totalHours}`);
    return totalHours;
  } catch (error) {
    console.error("Error in getProjectHoursUsed:", error);
    return 0;
  }
};

/**
 * Gets project budget information
 */
export const getProjectBudget = async (projectId: string): Promise<Project | null> => {
  try {
    console.log(`=== FETCHING PROJECT BUDGET ===`);
    console.log(`Project ID: ${projectId}`);

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, budget_hours, is_active")
      .eq("id", projectId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching project budget:", error);
      throw error;
    }

    if (!data) {
      console.log("Project not found");
      return null;
    }

    console.log(`Project: ${data.name}, Budget: ${data.budget_hours} hours`);
    return data as Project;
  } catch (error) {
    console.error("Error in getProjectBudget:", error);
    return null;
  }
};

/**
 * Checks if user has admin privileges for budget override
 */
export const canUserOverrideBudget = async (userId?: string): Promise<boolean> => {
  if (!userId) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking user role:", error);
      return false;
    }

    const isAdmin = data?.role === "admin";
    console.log(`User ${userId} admin status: ${isAdmin}`);
    return isAdmin;
  } catch (error) {
    console.error("Error in canUserOverrideBudget:", error);
    return false;
  }
};

/**
 * Main budget validation function
 */
export const validateProjectBudget = async (
  options: BudgetCheckOptions
): Promise<BudgetValidationResult> => {
  try {
    console.log(`=== VALIDATING PROJECT BUDGET ===`);
    console.log(`Options:`, options);

    const { projectId, hoursToAdd, existingEntryId, userId } = options;

    // Get project budget information
    const project = await getProjectBudget(projectId);
    if (!project) {
      console.log("Project not found - validation failed");
      return {
        isValid: false,
        message: "Project not found",
        remainingHours: 0,
        totalBudget: 0,
        hoursUsed: 0,
        isOverBudget: true,
        canOverride: false,
        usagePercentage: 0
      };
    }

    // Check if project is active
    if (!project.is_active) {
      console.log("Project is inactive - validation failed");
      return {
        isValid: false,
        message: "Cannot log time to inactive project",
        remainingHours: 0,
        totalBudget: project.budget_hours || 0,
        hoursUsed: 0,
        isOverBudget: true,
        canOverride: false,
        usagePercentage: 0
      };
    }

    // Get current hours used (excluding current entry if updating)
    const hoursUsed = await getProjectHoursUsed(projectId, existingEntryId);
    const totalBudget = project.budget_hours || 0;

    // Handle unlimited budget (budget_hours = 0 or null means unlimited)
    if (!totalBudget || totalBudget <= 0) {
      console.log("Project has unlimited budget - validation passed");
      return {
        isValid: true,
        remainingHours: Infinity,
        totalBudget: 0,
        hoursUsed,
        isOverBudget: false,
        canOverride: false,
        usagePercentage: 0
      };
    }

    // Calculate remaining hours and usage percentage
    const remainingHours = totalBudget - hoursUsed;
    const wouldExceedBudget = hoursUsed + hoursToAdd > totalBudget;
    const isCurrentlyOverBudget = hoursUsed > totalBudget;
    const usagePercentage = totalBudget > 0 ? (hoursUsed / totalBudget) * 100 : 0;

    // Check admin override capability
    const canOverride = await canUserOverrideBudget(userId);

    console.log(`Budget Analysis:`);
    console.log(`- Total Budget: ${totalBudget} hours`);
    console.log(`- Hours Used: ${hoursUsed} hours`);
    console.log(`- Hours to Add: ${hoursToAdd} hours`);
    console.log(`- Remaining: ${remainingHours} hours`);
    console.log(`- Usage Percentage: ${usagePercentage.toFixed(1)}%`);
    console.log(`- Would Exceed: ${wouldExceedBudget}`);
    console.log(`- Can Override: ${canOverride}`);

    // Admin override logic
    if (wouldExceedBudget && canOverride) {
      console.log("Budget would be exceeded but admin can override");
      return {
        isValid: true, // Allow admin to proceed
        message: `Warning: This entry will exceed the project budget by ${(hoursUsed + hoursToAdd - totalBudget).toFixed(1)} hours. Admin override active.`,
        remainingHours,
        totalBudget,
        hoursUsed,
        isOverBudget: wouldExceedBudget,
        canOverride: true,
        usagePercentage
      };
    }

    // Regular validation for non-admin users
    if (wouldExceedBudget) {
      const excessHours = (hoursUsed + hoursToAdd - totalBudget).toFixed(1);
      console.log(`Budget validation failed - would exceed by ${excessHours} hours`);
      
      return {
        isValid: false,
        message: `This entry would exceed the project budget by ${excessHours} hours. Current usage: ${hoursUsed}/${totalBudget} hours. Please contact your administrator for approval.`,
        remainingHours,
        totalBudget,
        hoursUsed,
        isOverBudget: true,
        canOverride: false,
        usagePercentage
      };
    }

    // Validation passed
    console.log("Budget validation passed");
    
    // Provide warning if close to budget limit (within 10% or 5 hours)
    const warningThreshold = Math.min(totalBudget * 0.1, 5);
    let message;
    if (remainingHours - hoursToAdd <= warningThreshold && remainingHours - hoursToAdd > 0) {
      message = `Warning: Only ${(remainingHours - hoursToAdd).toFixed(1)} hours remaining after this entry.`;
    }

    return {
      isValid: true,
      message,
      remainingHours,
      totalBudget,
      hoursUsed,
      isOverBudget: false,
      canOverride,
      usagePercentage
    };

  } catch (error) {
    console.error("Error in validateProjectBudget:", error);
    return {
      isValid: false,
      message: "Failed to validate project budget. Please try again.",
      remainingHours: 0,
      totalBudget: 0,
      hoursUsed: 0,
      isOverBudget: true,
      canOverride: false,
      usagePercentage: 0
    };
  }
};

/**
 * Simplified function to check if hours can be added to a project
 */
export const canAddHoursToProject = async (
  projectId: string,
  hoursToAdd: number,
  userId?: string,
  existingEntryId?: string
): Promise<{ canAdd: boolean; message?: string }> => {
  const validation = await validateProjectBudget({
    projectId,
    hoursToAdd,
    existingEntryId,
    userId
  });

  return {
    canAdd: validation.isValid,
    message: validation.message
  };
};

/**
 * Get budget status for display purposes
 */
export const getProjectBudgetStatus = async (
  projectId: string
): Promise<{
  totalBudget: number;
  hoursUsed: number;
  remainingHours: number;
  usagePercentage: number;
  isOverBudget: boolean;
  hasUnlimitedBudget: boolean;
}> => {
  try {
    const project = await getProjectBudget(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const hoursUsed = await getProjectHoursUsed(projectId);
    const totalBudget = project.budget_hours || 0;
    const hasUnlimitedBudget = !totalBudget || totalBudget <= 0;

    if (hasUnlimitedBudget) {
      return {
        totalBudget: 0,
        hoursUsed,
        remainingHours: Infinity,
        usagePercentage: 0,
        isOverBudget: false,
        hasUnlimitedBudget: true
      };
    }

    const remainingHours = totalBudget - hoursUsed;
    const usagePercentage = totalBudget > 0 ? (hoursUsed / totalBudget) * 100 : 0;
    const isOverBudget = hoursUsed > totalBudget;

    return {
      totalBudget,
      hoursUsed,
      remainingHours,
      usagePercentage,
      isOverBudget,
      hasUnlimitedBudget: false
    };
  } catch (error) {
    console.error("Error getting project budget status:", error);
    return {
      totalBudget: 0,
      hoursUsed: 0,
      remainingHours: 0,
      usagePercentage: 0,
      isOverBudget: false,
      hasUnlimitedBudget: false
    };
  }
};
