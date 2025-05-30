
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/utils/roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReportFilters from "@/components/reports/ReportFilters";
import ReportCharts from "@/components/reports/ReportCharts";
import ReportDataTable from "@/components/reports/ReportDataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { TimesheetEntry, Project, fetchReportData } from "@/lib/timesheet-service";
import { Contract } from "@/lib/contract-service";
import { Customer } from "@/lib/customer-service";
import { User } from "@/lib/user-service";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date-utils";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export-utils";

export type ReportFiltersType = {
  startDate: Date;
  endDate: Date;
  customerId: string | null;
  contractId: string | null;
  projectId: string | null;
  userId: string | null;
};

export type ReportColumnConfigType = {
  includeEmployeeDetails: boolean;
  includeProjectDetails: boolean;
  includeContractDetails: boolean;
  includeJiraTaskId: boolean;
};

const ReportsPage = () => {
  const {
    user
  } = useAuth();
  const [userIsAdmin, setUserIsAdmin] = useState<boolean | null>(null);

  // Defense-in-depth: Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const adminStatus = await isAdmin(user);
        setUserIsAdmin(adminStatus);
      }
    };
    checkAdmin();
  }, [user]);

  // Return null if user is not admin (backup protection)
  if (userIsAdmin === false) {
    return null;
  }
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<TimesheetEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<ReportFiltersType>({
    startDate: new Date(new Date().setDate(1)),
    // First day of current month
    endDate: new Date(),
    customerId: null,
    contractId: null,
    projectId: null,
    userId: null
  });

  const [columnConfig, setColumnConfig] = useState<ReportColumnConfigType>({
    includeEmployeeDetails: false,
    includeProjectDetails: false,
    includeContractDetails: false,
    includeJiraTaskId: false
  });

  // Check if export is available (data has been generated)
  const isExportDisabled = reportData.length === 0 || projects.length === 0 || users.length === 0;
  const handleExportCSV = () => {
    try {
      exportToCSV(reportData, projects, users, columnConfig, `timesheet-report-${formatDate(new Date())}`);
      toast({
        title: "Export successful",
        description: "The report has been exported to CSV"
      });
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "There was an error exporting the report",
        variant: "destructive"
      });
    }
  };
  const handleExportExcel = () => {
    try {
      exportToExcel(reportData, projects, users, columnConfig, `timesheet-report-${formatDate(new Date())}`);
      toast({
        title: "Export successful",
        description: "The report has been exported to Excel"
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "There was an error exporting the report",
        variant: "destructive"
      });
    }
  };
  const handleExportPDF = () => {
    try {
      exportToPDF(reportData, projects, users, filters, columnConfig, `timesheet-report-${formatDate(new Date())}`);
      toast({
        title: "Export successful",
        description: "The report has been exported to PDF"
      });
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "There was an error exporting the report",
        variant: "destructive"
      });
    }
  };
  return <div className="container mx-auto px-2 md:px-4">
      <div className="mb-4 md:mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Reports</h1>
          <p className="text-gray-600 text-sm md:text-base">Generate and download time reports</p>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV} disabled={isExportDisabled} title={isExportDisabled ? "Generate a report first to enable export" : "Export to CSV"}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          
          <Button size="sm" variant="default" onClick={handleExportPDF} disabled={isExportDisabled} title={isExportDisabled ? "Generate a report first to enable export" : "Export to PDF"}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {isExportDisabled && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            💡 Generate a report using the filters below to enable export options.
          </p>
        </div>}

      <Card>
        <CardHeader>
          <CardTitle>Time Reports</CardTitle>
          <CardDescription>Create custom reports for your team</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportFilters 
            filters={filters} 
            setFilters={setFilters} 
            columnConfig={columnConfig}
            setColumnConfig={setColumnConfig}
            setReportData={setReportData} 
            setProjects={setProjects} 
            setContracts={setContracts} 
            setCustomers={setCustomers} 
            setUsers={setUsers} 
            setIsLoading={setIsLoading} 
          />
          
          <Separator className="my-6" />
          
          <Tabs defaultValue="visual" className="w-full">
            <TabsList>
              <TabsTrigger value="visual">Visual Reports</TabsTrigger>
              <TabsTrigger value="tabular">Tabular Data</TabsTrigger>
            </TabsList>
            <TabsContent value="visual" className="mt-4">
              <ReportCharts reportData={reportData} projects={projects} users={users} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="tabular" className="mt-4">
              <ReportDataTable 
                reportData={reportData} 
                projects={projects} 
                users={users} 
                columnConfig={columnConfig}
                isLoading={isLoading} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default ReportsPage;
