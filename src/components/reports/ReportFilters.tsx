
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomers } from "@/lib/customer-service";
import { fetchContracts } from "@/lib/contract-service";
import { fetchUserProjects } from "@/lib/timesheet-service";
import { fetchUsers } from "@/lib/user-service";
import { ReportFiltersType, ReportColumnConfigType } from "@/pages/ReportsPage";
import { DateRangeFilterNew } from "./filters/DateRangeFilterNew";
import { SelectFilters } from "./filters/SelectFilters";
import { FilterActions } from "./filters/FilterActions";
import { ColumnConfig } from "./filters/ColumnConfig";
import { useReportGeneration } from "./filters/hooks/useReportGeneration";

interface ReportFiltersProps {
  filters: ReportFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<ReportFiltersType>>;
  columnConfig: ReportColumnConfigType;
  setColumnConfig: React.Dispatch<React.SetStateAction<ReportColumnConfigType>>;
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
  columnConfig,
  setColumnConfig,
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
    <Card className="p-4">
      <div className="flex flex-wrap gap-4">
        <DateRangeFilterNew filters={filters} setFilters={setFilters} />

        {isExpanded && (
          <>
            <SelectFilters
              filters={filters}
              setFilters={setFilters}
              customersData={customersData}
              projectsData={projectsData}
              contractsData={contractsData}
              usersData={usersData}
              normalizeSelectValue={normalizeSelectValue}
            />
            
            <ColumnConfig
              columnConfig={columnConfig}
              setColumnConfig={setColumnConfig}
            />
          </>
        )}

        <FilterActions
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          onGenerateReport={generateReport}
          isGeneratingReport={isGeneratingReport}
        />
      </div>
    </Card>
  );
};

export default ReportFilters;
