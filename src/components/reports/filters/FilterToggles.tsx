
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

  return (
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
    </div>
  );
};
