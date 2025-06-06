
import { toast } from "@/hooks/use-toast";
import { BudgetValidationResult } from "./validation/budget-validation-service";

export const showBudgetToast = (validation: BudgetValidationResult, projectName?: string, userRole?: string) => {
  const project = projectName ? `for ${projectName}` : "";
  const isAdmin = userRole === "admin";
  
  if (!validation.isValid && !validation.canOverride) {
    // Error toast for budget exceeded - generic message for employees
    if (isAdmin) {
      toast({
        title: "Budget Exceeded",
        description: `Cannot save entry ${project}. ${validation.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Budget Exceeded",
        description: `This project is over budget. Please contact your administrator.`,
        variant: "destructive",
      });
    }
  } else if (!validation.isValid && validation.canOverride) {
    // Warning toast for admin override
    if (isAdmin) {
      toast({
        title: "Budget Override Used",
        description: `Entry saved ${project} with admin override. ${validation.message}`,
        variant: "default",
      });
    } else {
      toast({
        title: "Entry Saved",
        description: `Your entry has been saved.`,
        variant: "default",
      });
    }
  } else if (validation.message && validation.usagePercentage >= 75 && isAdmin) {
    // Warning toast for high usage - only show to admins
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
  projectName?: string,
  userRole?: string
) => {
  const isAdmin = userRole === "admin";
  let description = isUpdate ? "Your timesheet entry has been updated." : "Your timesheet entry has been created.";
  
  // Only show budget override information to admins
  if (validation && validation.canOverride && !validation.isValid && isAdmin) {
    description += " Budget override was applied.";
  }
  
  toast({
    title: isUpdate ? "Entry Updated" : "Entry Created",
    description,
    variant: "default",
  });
};
