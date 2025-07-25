
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportFiltersType } from "@/pages/ReportsPage";

interface FilterTogglesProps {
  filters: ReportFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<ReportFiltersType>>;
}

export const FilterToggles = ({ filters, setFilters }: FilterTogglesProps) => {
  const handleProjectToggle = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      includeProject: checked,
      // Clear project filter when disabled
      projectId: checked ? prev.projectId : null
    }));
  };

  const handleContractToggle = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      includeContract: checked,
      // Clear contract filter when disabled
      contractId: checked ? prev.contractId : null
    }));
  };

  const handleEmployeeIdsToggle = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      includeEmployeeIds: checked
    }));
  };

  const handleReportTypeChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      reportType: value as 'timesheet' | 'audit' | 'leave',
      // Clear action type when switching away from audit
      actionType: value === 'audit' ? prev.actionType : null,
      // Set default leave report type when switching to leave
      leaveReportType: value === 'leave' ? 'usage' : prev.leaveReportType
    }));
  };

  const handleLeaveReportTypeChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      leaveReportType: value as 'usage' | 'balance' | 'calendar' | 'trends' | 'summary'
    }));
  };

  const handleLeaveYearChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      leaveYear: parseInt(value)
    }));
  };

  const handleLeaveGroupByChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      leaveGroupBy: value as 'month' | 'quarter'
    }));
  };

  return (
    <div className="space-y-4">
      {/* Report Type Selection */}
      <div className="w-full md:w-auto">
        <label className="text-sm font-medium mb-2 block">Report Type</label>
        <Select
          value={filters.reportType}
          onValueChange={handleReportTypeChange}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="timesheet">Timesheet Reports</SelectItem>
            <SelectItem value="audit">Audit Logs</SelectItem>
            <SelectItem value="leave">Leave Reports</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show timesheet-specific toggles only for timesheet reports */}
      {filters.reportType === 'timesheet' && (
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-project"
              checked={filters.includeProject}
              onCheckedChange={handleProjectToggle}
            />
            <Label htmlFor="include-project" className="cursor-pointer text-sm font-medium">
              Filter by Project
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-contract"
              checked={filters.includeContract}
              onCheckedChange={handleContractToggle}
            />
            <Label htmlFor="include-contract" className="cursor-pointer text-sm font-medium">
              Filter by Contract
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-employee-ids"
              checked={filters.includeEmployeeIds}
              onCheckedChange={handleEmployeeIdsToggle}
            />
            <Label htmlFor="include-employee-ids" className="cursor-pointer text-sm font-medium">
              Include Employee IDs
            </Label>
          </div>
        </div>
      )}

      {/* Show leave-specific options only for leave reports */}
      {filters.reportType === 'leave' && (
        <div className="space-y-4">
          <div className="w-full md:w-auto">
            <label className="text-sm font-medium mb-2 block">Leave Report Type</label>
            <Select
              value={filters.leaveReportType || 'usage'}
              onValueChange={handleLeaveReportTypeChange}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select leave report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usage">Usage Analytics</SelectItem>
                <SelectItem value="balance">Balance Report</SelectItem>
                <SelectItem value="calendar">Team Calendar</SelectItem>
                <SelectItem value="trends">Trends Analysis</SelectItem>
                <SelectItem value="summary">Summary Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show year selector for balance reports */}
          {filters.leaveReportType === 'balance' && (
            <div className="w-full md:w-auto">
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select
                value={filters.leaveYear?.toString() || new Date().getFullYear().toString()}
                onValueChange={handleLeaveYearChange}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show group by selector for trends */}
          {filters.leaveReportType === 'trends' && (
            <div className="w-full md:w-auto">
              <label className="text-sm font-medium mb-2 block">Group By</label>
              <Select
                value={filters.leaveGroupBy || 'month'}
                onValueChange={handleLeaveGroupByChange}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
