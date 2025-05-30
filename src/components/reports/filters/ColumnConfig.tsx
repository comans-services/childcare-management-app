
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ReportColumnConfigType } from "@/pages/ReportsPage";
import { Settings2 } from "lucide-react";

interface ColumnConfigProps {
  columnConfig: ReportColumnConfigType;
  setColumnConfig: React.Dispatch<React.SetStateAction<ReportColumnConfigType>>;
}

export const ColumnConfig = ({ columnConfig, setColumnConfig }: ColumnConfigProps) => {
  const handleConfigChange = (key: keyof ReportColumnConfigType, value: boolean) => {
    setColumnConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings2 className="h-4 w-4" />
          Column Configuration
        </CardTitle>
        <CardDescription className="text-xs">
          Choose which additional columns to include in the report
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="employeeDetails"
              checked={columnConfig.includeEmployeeDetails}
              onCheckedChange={(checked) => 
                handleConfigChange('includeEmployeeDetails', checked as boolean)
              }
            />
            <label
              htmlFor="employeeDetails"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Employee Details
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="projectDetails"
              checked={columnConfig.includeProjectDetails}
              onCheckedChange={(checked) => 
                handleConfigChange('includeProjectDetails', checked as boolean)
              }
            />
            <label
              htmlFor="projectDetails"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Project Details
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="contractDetails"
              checked={columnConfig.includeContractDetails}
              onCheckedChange={(checked) => 
                handleConfigChange('includeContractDetails', checked as boolean)
              }
            />
            <label
              htmlFor="contractDetails"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Contract Details
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="jiraTaskId"
              checked={columnConfig.includeJiraTaskId}
              onCheckedChange={(checked) => 
                handleConfigChange('includeJiraTaskId', checked as boolean)
              }
            />
            <label
              htmlFor="jiraTaskId"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Jira Task ID
            </label>
          </div>
        </div>
        
        {(columnConfig.includeEmployeeDetails || columnConfig.includeProjectDetails || 
          columnConfig.includeContractDetails || columnConfig.includeJiraTaskId) && (
          <div className="mt-3 p-2 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-800">
              Selected columns will appear in both the table view and exported reports.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
