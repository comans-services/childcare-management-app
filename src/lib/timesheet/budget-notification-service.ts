
import { toast } from "@/hooks/use-toast";
import { BudgetValidationResult } from "./validation/budget-validation-service";

export const showBudgetToast = (validation: BudgetValidationResult, projectName?: string) => {
  const project = projectName ? `for ${projectName}` : "";
  
  if (!validation.isValid && !validation.canOverride) {
    // Error toast for budget exceeded
    toast({
      title: "Budget Exceeded",
      description: `Cannot save entry ${project}. ${validation.message}`,
      variant: "destructive",
    });
  } else if (!validation.isValid && validation.canOverride) {
    // Warning toast for admin override
    toast({
      title: "Budget Override Used",
      description: `Entry saved ${project} with admin override. ${validation.message}`,
      variant: "default",
    });
  } else if (validation.message && validation.usagePercentage >= 75) {
    // Warning toast for high usage
    toast({
      title: "Budget Warning",
      description: `${validation.message} Project ${project} is at ${validation.usagePercentage.toFixed(0)}% of budget.`,
      variant: "default",
    });
  }
};

export const showBudgetSaveSuccess = (
  isUpdate: boolean, 
  validation?: BudgetValidationResult, 
  projectName?: string
) => {
  let description = isUpdate ? "Your timesheet entry has been updated." : "Your timesheet entry has been created.";
  
  if (validation && validation.canOverride && !validation.isValid) {
    description += " Budget override was applied.";
  }
  
  toast({
    title: isUpdate ? "Entry Updated" : "Entry Created",
    description,
    variant: "default",
  });
};
