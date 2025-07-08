
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Infinity } from "lucide-react";
import { Project } from "@/lib/timesheet/types";

interface ProjectBudgetDisplayProps {
  project: Project;
  showProgress?: boolean;
}

const ProjectBudgetDisplay = ({ project, showProgress = true }: ProjectBudgetDisplayProps) => {
  const hoursUsed = project.hours_used || 0;
  const budgetHours = project.budget_hours || 0;
  const hasBudgetLimit = project.has_budget_limit !== false; // Default to true if undefined

  if (!hasBudgetLimit) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Infinity className="h-3 w-3" />
          Unlimited Budget
        </Badge>
        <span className="text-sm text-muted-foreground">
          {hoursUsed}h used
        </span>
      </div>
    );
  }

  const progressPercentage = budgetHours > 0 ? Math.min((hoursUsed / budgetHours) * 100, 100) : 0;
  const isOverBudget = hoursUsed > budgetHours;
  const isNearBudget = progressPercentage >= 80 && !isOverBudget;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Budget Progress</span>
        <span className={`font-medium ${isOverBudget ? 'text-red-600' : isNearBudget ? 'text-amber-600' : 'text-foreground'}`}>
          {hoursUsed}h / {budgetHours}h
        </span>
      </div>
      {showProgress && (
        <Progress 
          value={progressPercentage} 
          className={`h-2 ${isOverBudget ? 'bg-red-100' : isNearBudget ? 'bg-amber-100' : ''}`}
        />
      )}
      {isOverBudget && (
        <Badge variant="destructive" className="text-xs">
          Over Budget by {(hoursUsed - budgetHours).toFixed(1)}h
        </Badge>
      )}
      {isNearBudget && (
        <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
          Approaching Budget Limit
        </Badge>
      )}
    </div>
  );
};

export default ProjectBudgetDisplay;
