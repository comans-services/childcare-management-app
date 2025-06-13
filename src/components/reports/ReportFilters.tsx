
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomers } from "@/lib/customer-service";
import { fetchContracts } from "@/lib/contract-service";
import { fetchUserProjects, fetchProjects } from "@/lib/timesheet-service";
import { fetchUsers } from "@/lib/user-service";
import { getAuditActionTypes, getAuditEntityTypes } from "@/lib/audit/audit-service";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/utils/roles";
import { ReportFiltersType } from "@/pages/ReportsPage";
import { DateRangeFilterNew } from "./filters/DateRangeFilterNew";
import { SelectFilters } from "./filters/SelectFilters";
import { FilterActions } from "./filters/FilterActions";
import { FilterToggles } from "./filters/FilterToggles";
import { useReportGeneration } from "./filters/hooks/useReportGeneration";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReportFiltersProps {
  filters: ReportFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<ReportFiltersType>>;
  setReportData: React.Dispatch<React.SetStateAction<any[]>>;
  setAuditData: React.Dispatch<React.SetStateAction<any[]>>;
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
  setAuditData,
  setProjects, 
  setContracts, 
  setCustomers,
  setUsers,
  setIsLoading 
}: ReportFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState<boolean | null>(null);
  const { user } = useAuth();
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const adminStatus = await isAdmin(user);
        setUserIsAdmin(adminStatus);
      }
    };
    checkAdminStatus();
  }, [user]);

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers
  });

  const { data: contractsData } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => fetchContracts()
  });

  // Conditionally fetch projects based on admin status
  const { data: projectsData } = useQuery({
    queryKey: ['projects', userIsAdmin],
    queryFn: () => {
      // If user is admin, fetch all projects; otherwise fetch only assigned projects
      return userIsAdmin ? fetchProjects() : fetchUserProjects();
    },
    enabled: userIsAdmin !== null // Only run query when admin status is determined
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  // Fetch audit-specific filter options
  const { data: actionTypesData } = useQuery({
    queryKey: ['audit-action-types'],
    queryFn: getAuditActionTypes,
    enabled: filters.reportType === 'audit'
  });

  const { data: entityTypesData } = useQuery({
    queryKey: ['audit-entity-types'],
    queryFn: getAuditEntityTypes,
    enabled: filters.reportType === 'audit'
  });

  const { generateReport, isGeneratingReport, normalizeSelectValue } = useReportGeneration({
    filters,
    setReportData,
    setAuditData,
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
        {/* Report Type Selection */}
        <div className="space-y-3">
          <Label>Report Type</Label>
          <RadioGroup 
            value={filters.reportType} 
            onValueChange={(value: 'timesheet' | 'audit') => 
              setFilters(prev => ({ 
                ...prev, 
                reportType: value,
                // Reset type-specific filters when switching
                actionType: null,
                entityType: null,
                includeProject: value === 'timesheet' ? prev.includeProject : false,
                includeContract: value === 'timesheet' ? prev.includeContract : false,
                includeEmployeeIds: value === 'timesheet' ? prev.includeEmployeeIds : false
              }))
            }
            className="flex flex-row gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="timesheet" id="timesheet" />
              <Label htmlFor="timesheet" className="cursor-pointer">Timesheet Reports</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="audit" id="audit" />
              <Label htmlFor="audit" className="cursor-pointer">Audit Logs</Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

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

        {/* Type-specific filters */}
        {isExpanded && (
          <div className="space-y-4">
            <Separator />
            
            {filters.reportType === 'timesheet' ? (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Timesheet Filters</h4>
                <FilterToggles filters={filters} setFilters={setFilters} />

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
            ) : (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Audit Log Filters</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* User Filter */}
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Select 
                      value={filters.userId || "all"} 
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        userId: normalizeSelectValue(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {usersData?.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Type Filter */}
                  <div className="space-y-2">
                    <Label>Action Type</Label>
                    <Select 
                      value={filters.actionType || "all"} 
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        actionType: normalizeSelectValue(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        {actionTypesData?.map(action => (
                          <SelectItem key={action} value={action}>
                            {action}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Entity Type Filter */}
                  <div className="space-y-2">
                    <Label>Entity Type</Label>
                    <Select 
                      value={filters.entityType || "all"} 
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        entityType: normalizeSelectValue(value) 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Entities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Entities</SelectItem>
                        {entityTypesData?.map(entity => (
                          <SelectItem key={entity} value={entity}>
                            {entity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReportFilters;
