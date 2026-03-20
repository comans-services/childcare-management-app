import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/utils/roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReportFilters from "@/components/reports/ReportFilters";
import ReportDataTable from "@/components/reports/ReportDataTable";
import AuditLogsTable from "@/components/reports/AuditLogsTable";
import TimesheetLockManager from "@/components/reports/TimesheetLockManager";
import { PayrollReportsSection } from "@/components/reports/PayrollReportsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import { TimesheetEntry } from "@/lib/timesheet-service";
import { User } from "@/lib/user-service";
import { AuditLogEntry } from "@/lib/audit/audit-service";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date-utils";
import { fetchMatrixData, downloadMatrixCSV, downloadMatrixPDF } from "@/lib/reports/timesheet-matrix-export-service";

export type ReportFiltersType = {
  startDate: Date;
  endDate: Date;
  userIds: string[];
  employmentType?: string;
  organizationvalue?: string;
  includeEmployeeIds: boolean;
  includeOrganization: boolean;
  includeTimeZone: boolean;
  reportType: 'timesheet' | 'audit' | 'locks';
  actionType?: string;
};

const ReportsPage = () => {
  const { user } = useAuth();
  const [userIsAdmin, setUserIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const adminStatus = await isAdmin(user);
        setUserIsAdmin(adminStatus);
      }
    };
    checkAdmin();
  }, [user]);

  if (userIsAdmin === false) {
    return null;
  }

  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<TimesheetEntry[]>([]);
  const [auditData, setAuditData] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [filters, setFilters] = useState<ReportFiltersType>({
    startDate: new Date(new Date().setDate(1)),
    endDate: new Date(),
    userIds: [],
    employmentType: undefined,
    organizationvalue: undefined,
    includeEmployeeIds: false,
    includeOrganization: false,
    includeTimeZone: false,
    reportType: 'timesheet',
    actionType: undefined
  });

  const isExportDisabled = () => {
    if (filters.reportType === 'timesheet') {
      return !reportData || reportData.length === 0;
    } else if (filters.reportType === 'audit') {
      return !auditData || auditData.length === 0;
    }
    return true;
  };

  const handleExportTimesheet = async (format: 'csv' | 'pdf') => {
    try {
      toast({
        title: "Generating report...",
        description: "Please wait while we prepare your export",
      });

      const matrixData = await fetchMatrixData({
        startDate: filters.startDate,
        endDate: filters.endDate,
        employmentType: filters.employmentType,
        userIds: filters.userIds?.filter(id => id),
      });

      if (matrixData.employees.length === 0) {
        toast({
          title: "No data to export",
          description: "No employees found for the selected filters",
          variant: "destructive"
        });
        return;
      }

      const filename = `timesheet-${formatDate(filters.startDate)}-${formatDate(filters.endDate)}.${format}`;

      if (format === 'csv') {
        downloadMatrixCSV(matrixData, filename);
      } else {
        downloadMatrixPDF(matrixData, filename);
      }

      toast({
        title: "Export successful",
        description: `Report exported as ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export report",
        variant: "destructive"
      });
    }
  };

  const handleExportAudit = async () => {
    if (!auditData || auditData.length === 0) {
      toast({
        title: "No data to export",
        description: "Please generate an audit report first",
        variant: "destructive"
      });
      return;
    }

    try {
      const headers = ["Timestamp", "User", "Action", "Details"];
      const rows = auditData.map(log => [
        new Date(log.created_at).toISOString(),
        log.user_name || 'System',
        log.action,
        JSON.stringify(log.details || '')
      ].map(v => `"${v}"`).join(','));

      const csvContent = headers.join(',') + '\n' + rows.join('\n');
      const filename = `audit-logs-${formatDate(filters.startDate)}-${formatDate(filters.endDate)}.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Audit log exported as ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export comprehensive reports
          </p>
        </div>
        {filters.reportType === 'timesheet' ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportTimesheet('csv')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportTimesheet('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : filters.reportType === 'audit' ? (
          <Button onClick={handleExportAudit} disabled={isExportDisabled()}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        ) : null}
      </div>

      <Separator />

      <Tabs value={filters.reportType} onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value as any }))} className="space-y-4">
        <TabsList>
          <TabsTrigger value="timesheet">
            Timesheet &amp; Payroll
          </TabsTrigger>
          <TabsTrigger value="audit">
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="locks">
            Timesheet Locks
          </TabsTrigger>
        </TabsList>

        {filters.reportType !== 'locks' && (
          <ReportFilters
            filters={filters}
            setFilters={setFilters}
            setReportData={setReportData}
            setAuditData={setAuditData}
            setScheduleData={() => {}}
            setRoomData={() => {}}
            setIsLoading={setIsLoading}
          />
        )}

        <TabsContent value="timesheet" className="space-y-6">
          {/* Timesheet matrix report */}
          <ReportDataTable
            reportData={reportData}
            filters={filters}
            isLoading={isLoading}
          />

          <Separator />

          {/* Payroll section with its own pay period selector */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Payroll Report</h2>
            <PayrollReportsSection />
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogsTable auditData={auditData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="locks">
          <Card>
            <CardHeader>
              <CardTitle>Timesheet Lock Management</CardTitle>
              <CardDescription>
                Lock or unlock timesheet entries for specific date ranges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimesheetLockManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
