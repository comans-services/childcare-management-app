
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomers } from "@/lib/customer-service";
import { fetchContracts } from "@/lib/contract-service";
import { fetchUserProjects } from "@/lib/timesheet-service";
import { fetchUsers } from "@/lib/user-service";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ReportFiltersType } from "@/pages/ReportsPage";

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
  const { user } = useAuth();
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

  const handleGenerateReport = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log("Generating report with filters:", filters);
      
      // Start with base query
      let query = supabase
        .from("timesheet_entries")
        .select(`
          *,
          projects!inner(id, name, description, customer_id),
          profiles!inner(id, full_name, email, organization, time_zone)
        `);

      // Apply date range filters (required)
      const startDateStr = filters.startDate.toISOString().slice(0, 10);
      const endDateStr = filters.endDate.toISOString().slice(0, 10);
      
      query = query
        .gte('entry_date', startDateStr)
        .lte('entry_date', endDateStr);

      // Apply conditional filters only when they are not null/empty
      if (filters.userId) {
        query = query.eq("user_id", filters.userId);
      }

      if (filters.projectId) {
        query = query.eq("project_id", filters.projectId);
      }

      if (filters.customerId) {
        query = query.eq("projects.customer_id", filters.customerId);
      }

      // Note: Contract filtering would need to be implemented through a join
      // if contracts are linked to projects, but this isn't in the current schema
      
      // Execute the query
      const { data: entries, error } = await query.order("entry_date", { ascending: true });
      
      if (error) {
        console.error("Error fetching report data:", error);
        throw error;
      }
      
      console.log(`Fetched ${entries?.length || 0} entries for report`);
      
      // Transform the data to match the expected format
      const transformedData = entries?.map(entry => ({
        ...entry,
        project: entry.projects,
        user: entry.profiles
      })) || [];
      
      setReportData(transformedData);
    } catch (error) {
      console.error("Error generating report:", error);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <label className="text-sm font-medium">Date Range</label>
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[150px] justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? format(filters.startDate, "PPP") : <span>Start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) => date && setFilters(prev => ({ ...prev, startDate: date }))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <span>to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[150px] justify-start text-left font-normal",
                    !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? format(filters.endDate, "PPP") : <span>End date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => date && setFilters(prev => ({ ...prev, endDate: date }))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {isExpanded && (
          <>
            <div className="w-full md:w-auto">
              <label className="text-sm font-medium">Customer</label>
              <Select
                value={filters.customerId || ""}
                onValueChange={(value) => setFilters(prev => ({ ...prev, customerId: value || null }))}
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

            <div className="w-full md:w-auto">
              <label className="text-sm font-medium">Project</label>
              <Select
                value={filters.projectId || ""}
                onValueChange={(value) => setFilters(prev => ({ ...prev, projectId: value || null }))}
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

            <div className="w-full md:w-auto">
              <label className="text-sm font-medium">Contract</label>
              <Select
                value={filters.contractId || ""}
                onValueChange={(value) => setFilters(prev => ({ ...prev, contractId: value || null }))}
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

            <div className="w-full md:w-auto">
              <label className="text-sm font-medium">Employee</label>
              <Select
                value={filters.userId || ""}
                onValueChange={(value) => setFilters(prev => ({ ...prev, userId: value || null }))}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Employees</SelectItem>
                  {usersData?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || "Unknown User"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="flex items-end ml-auto gap-2 self-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Less Filters' : 'More Filters'}
          </Button>
          <Button 
            onClick={handleGenerateReport}
            size="sm"
          >
            <Search className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ReportFilters;
