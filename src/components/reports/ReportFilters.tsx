
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomers } from "@/lib/customer-service";
import { fetchContracts } from "@/lib/contract-service";
import { fetchUserProjects } from "@/lib/timesheet-service";
import { fetchUsers } from "@/lib/user-service";
import { ReportFiltersType } from "@/pages/ReportsPage";
import { DateRangeFilterNew } from "./filters/DateRangeFilterNew";
import { SelectFilters } from "./filters/SelectFilters";
import { FilterActions } from "./filters/FilterActions";
import { FilterToggles } from "./filters/FilterToggles";
import { useReportGeneration } from "./filters/hooks/useReportGeneration";
import { Separator } from "@/components/ui/separator";

interface ReportFiltersProps {
  filters: ReportFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<ReportFiltersType>>;
  setReportData: React.Dispatch<React.SetStateAction<any[]>>;
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
  setContracts: React.Dispatch<React.SetStateAction<any[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  setUsers: React.Dispatch<React.SetStateAction<any[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const ReportFilters = ({ 
  filters, 
  setFilters, 
  setReportData, 
  setProjects, 
  setContracts, 
  setCustomers,
  setUsers,
  setIsLoading 
}: ReportFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers
  });

  const { data: contractsData } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => fetchContracts()
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchUserProjects
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  const { generateReport, isGeneratingReport, normalizeSelectValue } = useReportGeneration({
    filters,
    setReportData,
    setIsLoading
  });

  useEffect(() => {
    if (customersData) {
      setCustomers(customersData);
    }
    if (contractsData) {
      setContracts(contractsData);
    }
    if (projectsData) {
      setProjects(projectsData);
    }
    if (usersData) {
      setUsers(usersData);
    }
  }, [customersData, contractsData, projectsData, usersData, setCustomers, setContracts, setProjects, setUsers]);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Primary filters - fixed spacing and alignment */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <DateRangeFilterNew filters={filters} setFilters={setFilters} />
          </div>
          
          <div className="flex-shrink-0">
            <FilterActions
              isExpanded={isExpanded}
              setIsExpanded={setIsExpanded}
              onGenerateReport={generateReport}
              isGeneratingReport={isGeneratingReport}
            />
          </div>
        </div>

        {/* Optional filter toggles */}
        {isExpanded && (
          <div className="space-y-4">
            <Separator />
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Optional Filters</h4>
              <FilterToggles filters={filters} setFilters={setFilters} />
            </div>

            {/* Conditional filter dropdowns */}
            {(filters.includeProject || filters.includeContract) && (
              <div className="flex flex-wrap gap-4 pt-2">
                <SelectFilters
                  filters={filters}
                  setFilters={setFilters}
                  customersData={customersData}
                  projectsData={projectsData}
                  contractsData={contractsData}
                  usersData={usersData}
                  normalizeSelectValue={normalizeSelectValue}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReportFilters;
