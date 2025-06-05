
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportFiltersType } from "@/pages/ReportsPage";

interface SelectFiltersProps {
  filters: ReportFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<ReportFiltersType>>;
  customersData?: any[];
  projectsData?: any[];
  contractsData?: any[];
  usersData?: any[];
  normalizeSelectValue: (value: string | undefined) => string | null;
}

export const SelectFilters = ({
  filters,
  setFilters,
  customersData,
  projectsData,
  contractsData,
  usersData,
  normalizeSelectValue
}: SelectFiltersProps) => {
  return (
    <>
      <div className="w-full md:w-auto">
        <label className="text-sm font-medium">Customer</label>
        <Select
          value={filters.customerId || ""}
          onValueChange={(value) => setFilters(prev => ({ ...prev, customerId: normalizeSelectValue(value) }))}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Customers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Customers</SelectItem>
            {customersData?.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.includeProject && (
        <div className="w-full md:w-auto">
          <label className="text-sm font-medium">Project</label>
          <Select
            value={filters.projectId || ""}
            onValueChange={(value) => setFilters(prev => ({ ...prev, projectId: normalizeSelectValue(value) }))}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Projects</SelectItem>
              {projectsData?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filters.includeContract && (
        <div className="w-full md:w-auto">
          <label className="text-sm font-medium">Contract</label>
          <Select
            value={filters.contractId || ""}
            onValueChange={(value) => setFilters(prev => ({ ...prev, contractId: normalizeSelectValue(value) }))}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All Contracts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Contracts</SelectItem>
              {contractsData?.map((contract) => (
                <SelectItem key={contract.id} value={contract.id}>
                  {contract.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="w-full md:w-auto">
        <label className="text-sm font-medium">Employee</label>
        <Select
          value={filters.userId || ""}
          onValueChange={(value) => setFilters(prev => ({ ...prev, userId: normalizeSelectValue(value) }))}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Employees</SelectItem>
            {usersData?.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.employee_id ? `${user.employee_id} - ${user.full_name || "Unknown User"}` : user.full_name || "Unknown User"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
