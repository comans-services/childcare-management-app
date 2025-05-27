
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, Search, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomers } from "@/lib/customer-service";
import { fetchContracts } from "@/lib/contract-service";
import { fetchUserProjects, fetchReportData } from "@/lib/timesheet-service";
import { fetchUsers } from "@/lib/user-service";
import { cn } from "@/lib/utils";
import { ReportFiltersType } from "@/pages/ReportsPage";
import { toast } from "@/hooks/use-toast";

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
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
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

  // Helper function to properly handle null/empty values for UUID fields
  const handleSelectChange = (value: string | undefined) => {
    // Convert "all", empty string, "empty", or undefined to null
    if (!value || value === "" || value === "empty" || value === "all") {
      return null;
    }
    return value;
  };

  const generateReport = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to generate reports",
        variant: "destructive"
      });
      return;
    }
    
    console.log("=== GENERATING REPORT ===");
    console.log("Current user:", user);
    console.log("Filters:", filters);
    
    setIsGeneratingReport(true);
    setIsLoading(true);
    
    try {
      // Call fetchReportData with all filters
      const reportData = await fetchReportData(filters.startDate, filters.endDate, {
        userId: filters.userId,
        projectId: filters.projectId,
        customerId: filters.customerId,
        contractId: filters.contractId
      });
      
      console.log("Report data received:", reportData);
      console.log("Number of entries:", reportData.length);
      
      setReportData(reportData);
      
      if (reportData.length === 0) {
        toast({
          title: "No data found",
          description: "No timesheet entries found for the selected criteria. Try adjusting your filters.",
          variant: "default"
        });
      } else {
        toast({
          title: "Report generated successfully",
          description: `Found ${reportData.length} timesheet entries`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setReportData([]);
      
      let errorMessage = "There was an error generating the report";
      if (error instanceof Error) {
        if (error.message.includes("Access denied")) {
          errorMessage = "Access denied. Admin role required to generate reports.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Report generation failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
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
                onValueChange={(value) => setFilters(prev => ({ ...prev, customerId: handleSelectChange(value) }))}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
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
                onValueChange={(value) => setFilters(prev => ({ ...prev, projectId: handleSelectChange(value) }))}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
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
                onValueChange={(value) => setFilters(prev => ({ ...prev, contractId: handleSelectChange(value) }))}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Contracts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contracts</SelectItem>
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
                onValueChange={(value) => setFilters(prev => ({ ...prev, userId: handleSelectChange(value) }))}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
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
            onClick={generateReport}
            size="sm"
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ReportFilters;
