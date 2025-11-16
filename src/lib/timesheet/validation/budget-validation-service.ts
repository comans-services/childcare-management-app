// Budget validation - disabled as projects table doesn't exist

export interface BudgetValidationResult {
  isValid: boolean;
  message?: string;
  remainingHours: number;
  totalBudget: number;
  hoursUsed: number;
  isOverBudget: boolean;
  canOverride: boolean;
  usagePercentage: number;
  hasUnlimitedBudget: boolean;
}

export interface BudgetCheckOptions {
  projectId: string;
  hoursToAdd: number;
  existingEntryId?: string;
  userId?: string;
}

export const getProjectBudgetStatus = async (projectId: string): Promise<BudgetValidationResult> => {
  return {
    isValid: true,
    remainingHours: 0,
    totalBudget: 0,
    hoursUsed: 0,
    isOverBudget: false,
    canOverride: false,
    usagePercentage: 0,
    hasUnlimitedBudget: true
  };
};

export const getProjectHoursUsed = async (projectId: string): Promise<number> => {
  return 0;
};

export const validateProjectBudget = async (
  options: BudgetCheckOptions
): Promise<BudgetValidationResult> => {
  return {
    isValid: true,
    remainingHours: 0,
    totalBudget: 0,
    hoursUsed: 0,
    isOverBudget: false,
    canOverride: false,
    usagePercentage: 0,
    hasUnlimitedBudget: true
  };
};
