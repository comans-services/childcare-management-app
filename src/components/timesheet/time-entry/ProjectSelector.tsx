
import React, { useEffect, useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { Project } from "@/lib/timesheet-service";
import { TimeEntryFormValues } from "./schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, AlertTriangle } from "lucide-react";
import { getProjectBudgetStatus } from "@/lib/timesheet/validation/budget-validation-service";

interface ProjectSelectorProps {
  control: Control<TimeEntryFormValues>;
  projects: Project[];
}

interface ProjectBudgetInfo {
  [projectId: string]: {
    totalBudget: number;
    hoursUsed: number;
    remainingHours: number;
    usagePercentage: number;
    isOverBudget: boolean;
    hasUnlimitedBudget: boolean;
  };
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ control, projects }) => {
  const [budgetInfo, setBudgetInfo] = useState<ProjectBudgetInfo>({});
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh budget info when projects change (e.g., after saving an entry)
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [projects]);

  // Fetch budget information for all projects
  useEffect(() => {
    const fetchBudgetInfo = async () => {
      if (projects.length === 0) return;

      setLoadingBudgets(true);
      try {
        console.log("=== REFRESHING PROJECT BUDGET INFO ===");
        const budgetPromises = projects.map(async (project) => {
          const budget = await getProjectBudgetStatus(project.id);
          return { projectId: project.id, budget };
        });

        const results = await Promise.all(budgetPromises);
        const budgetMap: ProjectBudgetInfo = {};
        
        results.forEach(({ projectId, budget }) => {
          budgetMap[projectId] = budget;
        });

        setBudgetInfo(budgetMap);
        console.log("Project budget info refreshed:", budgetMap);
      } catch (error) {
        console.error("Error fetching project budget info:", error);
      } finally {
        setLoadingBudgets(false);
      }
    };

    fetchBudgetInfo();
  }, [projects, refreshKey]); // Include refreshKey to force refresh

  const getBudgetColor = (usagePercentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return "text-red-600";
    if (usagePercentage >= 95) return "text-red-600";
    if (usagePercentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressBarColor = (usagePercentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return "bg-red-500";
    if (usagePercentage >= 95) return "bg-red-500";
    if (usagePercentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatBudgetDisplay = (project: Project) => {
    const budget = budgetInfo[project.id];
    if (!budget) return project.name;

    if (budget.hasUnlimitedBudget) {
      return `${project.name} (${budget.hoursUsed}h used, unlimited)`;
    }

    const usedDisplay = budget.hoursUsed.toFixed(1);
    const totalDisplay = budget.totalBudget.toFixed(1);
    
    return `${project.name} (${usedDisplay}/${totalDisplay}h used)`;
  };

  const renderProjectOption = (project: Project) => {
    const budget = budgetInfo[project.id];
    if (!budget || loadingBudgets) {
      return (
        <div className="flex flex-col space-y-1">
          <span>{project.name}</span>
          {loadingBudgets && (
            <div className="h-1 bg-gray-200 rounded animate-pulse" />
          )}
        </div>
      );
    }

    if (budget.hasUnlimitedBudget) {
      return (
        <div className="flex flex-col space-y-1">
          <span>{project.name}</span>
          <div className="flex items-center text-xs text-gray-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            {budget.hoursUsed.toFixed(1)}h used (unlimited budget)
          </div>
        </div>
      );
    }

    const usagePercentage = Math.min(budget.usagePercentage, 100);
    const colorClass = getBudgetColor(budget.usagePercentage, budget.isOverBudget);
    const progressColor = getProgressBarColor(budget.usagePercentage, budget.isOverBudget);

    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{project.name}</span>
          {budget.isOverBudget && (
            <AlertTriangle className="h-3 w-3 text-red-500" />
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className={colorClass}>
            {budget.hoursUsed.toFixed(1)}/{budget.totalBudget.toFixed(1)}h used
          </span>
          <span className={colorClass}>
            {budget.usagePercentage.toFixed(0)}%
          </span>
        </div>
        
        <Progress
          value={usagePercentage}
          className="h-1"
          indicatorClassName={progressColor}
        />
        
        {budget.remainingHours <= 5 && budget.remainingHours > 0 && (
          <div className="text-xs text-yellow-600 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {budget.remainingHours.toFixed(1)}h remaining
          </div>
        )}
        
        {budget.isOverBudget && (
          <div className="text-xs text-red-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Over budget by {Math.abs(budget.remainingHours).toFixed(1)}h
          </div>
        )}
      </div>
    );
  };

  return (
    <FormField
      control={control}
      name="project_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="font-medium">Project*</FormLabel>
          {projects.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No projects available. You can only log time to projects you're assigned to. 
                Please contact your administrator to get assigned to projects.
              </AlertDescription>
            </Alert>
          ) : (
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project">
                    {field.value && (() => {
                      const selectedProject = projects.find(p => p.id === field.value);
                      return selectedProject ? formatBudgetDisplay(selectedProject) : "Select a project";
                    })()}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-80">
                {projects.map((project) => (
                  <SelectItem 
                    key={project.id} 
                    value={project.id}
                    className="p-3"
                  >
                    {renderProjectOption(project)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
