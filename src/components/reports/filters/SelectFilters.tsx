
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportFiltersType } from "@/pages/ReportsPage";
import { Project } from "@/lib/timesheet-service";
import { Contract } from "@/lib/contract-service";
import { Customer } from "@/lib/customer-service";
import { User } from "@/lib/user-service";

interface SelectFiltersProps {
  filters: ReportFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<ReportFiltersType>>;
  projects: Project[];
  contracts: Contract[];
  customers: Customer[];
  users: User[];
  actionTypes: string[];
}

export const SelectFilters = ({
  filters,
  setFilters,
  projects,
  contracts,
  customers,
  users,
  actionTypes
}: SelectFiltersProps) => {
  const normalizeSelectValue = (value: string | undefined): string | null => {
    if (!value || value === "" || value === "all" || value === "empty") {
      return null;
    }
    return value;
  };

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
            {customers?.map((customer) => (
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
              {projects?.map((project) => (
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
              {contracts?.map((contract) => (
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
            {users?.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.employee_id ? `${user.employee_id} - ${user.full_name || "Unknown User"}` : user.full_name || "Unknown User"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.reportType === 'audit' && (
        <div className="w-full md:w-auto">
          <label className="text-sm font-medium">Action Type</label>
          <Select
            value={filters.actionType || ""}
            onValueChange={(value) => setFilters(prev => ({ ...prev, actionType: normalizeSelectValue(value) }))}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              {actionTypes?.map((actionType) => (
                <SelectItem key={actionType} value={actionType}>
                  {actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
};
