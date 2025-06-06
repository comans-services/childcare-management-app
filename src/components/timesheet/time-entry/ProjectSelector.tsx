import React, { useEffect, useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { Project } from "@/lib/timesheet-service";
import { TimeEntryFormValues } from "./schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getProjectBudgetStatus } from "@/lib/timesheet/validation/budget-validation-service";
import { useAuth } from "@/context/AuthContext";

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
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const [budgetInfo, setBudgetInfo] = useState<ProjectBudgetInfo>({});
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh budget info when projects change (e.g., after saving an entry)
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [projects]);

  // Fetch budget information for all projects (still needed for validation)
  useEffect(() => {
    const fetchBudgetInfo = async () => {
      if (projects.length === 0) return;

      setLoadingBudgets(true);
      try {
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
      } catch (error) {
        console.error("Error fetching project budget info:", error);
      } finally {
        setLoadingBudgets(false);
      }
    };

    fetchBudgetInfo();
  }, [projects, refreshKey]);

  // Simple display for employees - just project name
  const formatProjectDisplayForEmployee = (project: Project) => {
    return project.name;
  };

  // Detailed display for admins with budget info
  const formatProjectDisplayForAdmin = (project: Project) => {
    const budget = budgetInfo[project.id];
    if (!budget) return project.name;

    if (budget.hasUnlimitedBudget) {
      return `${project.name} (${budget.hoursUsed}h used, unlimited)`;
    }

    const usedDisplay = budget.hoursUsed.toFixed(1);
    const totalDisplay = budget.totalBudget.toFixed(1);
    
    return `${project.name} (${usedDisplay}/${totalDisplay}h used)`;
  };

  // Employee version - simple project display
  const renderProjectOptionForEmployee = (project: Project) => {
    const budget = budgetInfo[project.id];
    
    return (
      <div className="flex flex-col space-y-1">
        <span>{project.name}</span>
        {budget && budget.isOverBudget && (
          <div className="text-xs text-red-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Over budget - Contact administrator
          </div>
        )}
      </div>
    );
  };

  // Admin version - detailed project display with budget info
  const renderProjectOptionForAdmin = (project: Project) => {
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
            {budget.hoursUsed.toFixed(1)}h used (unlimited budget)
          </div>
        </div>
      );
    }

    const usagePercentage = Math.min(budget.usagePercentage, 100);
    const colorClass = budget.isOverBudget ? "text-red-600" : 
                      budget.usagePercentage >= 95 ? "text-red-600" :
                      budget.usagePercentage >= 75 ? "text-yellow-600" : "text-green-600";

    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{project.name}</span>
          {budget.isOverBudget && (
            <AlertCircle className="h-3 w-3 text-red-500" />
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
        
        {budget.remainingHours <= 5 && budget.remainingHours > 0 && (
          <div className="text-xs text-yellow-600 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
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
                      if (!selectedProject) return "Select a project";
                      
                      return isAdmin 
                        ? formatProjectDisplayForAdmin(selectedProject)
                        : formatProjectDisplayForEmployee(selectedProject);
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
                    {isAdmin 
                      ? renderProjectOptionForAdmin(project)
                      : renderProjectOptionForEmployee(project)
                    }
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
