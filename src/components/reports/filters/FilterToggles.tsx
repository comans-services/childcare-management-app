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
  const handleEmployeeIdsToggle = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      includeEmployeeIds: checked
    }));
  };

  const handleOrganizationToggle = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      includeOrganization: checked
    }));
  };

  const handleTimeZoneToggle = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      includeTimeZone: checked
    }));
  };

  const handleReportTypeChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      reportType: value as ReportFiltersType['reportType'],
      actionType: value === 'audit' ? prev.actionType : undefined
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
            <SelectItem value="schedules">Schedule Reports</SelectItem>
            <SelectItem value="rooms">Room Activity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Show timesheet-specific toggles only for timesheet reports */}
      {filters.reportType === 'timesheet' && (
        <div className="flex flex-wrap gap-6">
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-organization"
              checked={filters.includeOrganization}
              onCheckedChange={handleOrganizationToggle}
            />
            <Label htmlFor="include-organization" className="cursor-pointer text-sm font-medium">
              Include Organization
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-timezone"
              checked={filters.includeTimeZone}
              onCheckedChange={handleTimeZoneToggle}
            />
            <Label htmlFor="include-timezone" className="cursor-pointer text-sm font-medium">
              Include Time Zone
            </Label>
          </div>
        </div>
      )}
    </div>
  );
};
