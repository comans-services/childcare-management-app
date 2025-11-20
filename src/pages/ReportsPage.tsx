
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/utils/roles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ReportFilters from "@/components/reports/ReportFilters";
import ReportCharts from "@/components/reports/ReportCharts";
import ReportDataTable from "@/components/reports/ReportDataTable";
import AuditLogsTable from "@/components/reports/AuditLogsTable";
import LeaveReportsSection from "@/components/reports/LeaveReportsSection";
import ScheduleReportsSection from "@/components/reports/ScheduleReportsSection";
import RoomActivityReports from "@/components/reports/RoomActivityReports";
import TimesheetLockManager from "@/components/reports/TimesheetLockManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { TimesheetEntry } from "@/lib/timesheet-service";
import { User } from "@/lib/user-service";
import { AuditLogEntry } from "@/lib/audit/audit-service";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date-utils";

export type ReportFiltersType = {
  startDate: Date;
  endDate: Date;
  userIds: string[];
  employmentType?: string;
  organizationvalue?: string;
  roomIds?: string[];
  includeEmployeeIds: boolean;
  includeOrganization: boolean;
  includeTimeZone: boolean;
  reportType: 'timesheet' | 'audit' | 'leave' | 'schedules' | 'rooms';
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
  const [leaveData, setLeaveData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  const [filters, setFilters] = useState<ReportFiltersType>({
    startDate: new Date(new Date().setDate(1)),
    endDate: new Date(),
    userIds: [],
    employmentType: undefined,
    organizationvalue: undefined,
    roomIds: [],
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

  const handleExportCSV = async () => {
    if (isExportDisabled()) {
      toast({
        title: "No data to export",
        description: "Please generate a report first before exporting",
        variant: "destructive"
      });
      return;
    }

    try {
      let csvContent = "";
      let filename = "";

      if (filters.reportType === 'timesheet') {
        const headers = ["Date", "Employee", "Start Time", "End Time", "Hours"];
        if (filters.includeEmployeeIds) {
          headers.push("Employee ID", "Card ID");
        }
        
        const rows = reportData.map(entry => {
          const row: any[] = [
            formatDate(new Date(entry.entry_date)),
            entry.user_full_name || '',
            entry.start_time,
            entry.end_time,
            entry.hours_logged
          ];
          if (filters.includeEmployeeIds) {
            row.push((entry as any).employee_id || '', (entry as any).employee_card_id || '');
          }
          return row.map(v => `"${v}"`).join(',');
        });

        csvContent = headers.join(',') + '\n' + rows.join('\n');
        filename = `timesheet-report-${formatDate(filters.startDate)}-${formatDate(filters.endDate)}.csv`;
      } else if (filters.reportType === 'audit') {
        const headers = ["Timestamp", "User", "Action", "Details"];
        const rows = auditData.map(log => [
          new Date(log.created_at).toISOString(),
          log.user_name || 'System',
          log.action,
          JSON.stringify(log.details || '')
        ].map(v => `"${v}"`).join(','));

        csvContent = headers.join(',') + '\n' + rows.join('\n');
        filename = `audit-logs-${formatDate(filters.startDate)}-${formatDate(filters.endDate)}.csv`;
      }

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
        description: `Report exported as ${filename}`,
        variant: "default"
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export comprehensive reports
          </p>
        </div>
        <Button onClick={handleExportCSV} disabled={isExportDisabled()}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Separator />

      <ReportFilters
        filters={filters}
        setFilters={setFilters}
        setReportData={setReportData}
        setAuditData={setAuditData}
        setLeaveData={setLeaveData}
        setScheduleData={setScheduleData}
        setRoomData={setRoomData}
        setIsLoading={setIsLoading}
      />

      <Tabs defaultValue={filters.reportType} value={filters.reportType} className="space-y-4">
        <TabsList>
          <TabsTrigger value="timesheet" onClick={() => setFilters(prev => ({ ...prev, reportType: 'timesheet' }))}>
            Timesheet Reports
          </TabsTrigger>
          <TabsTrigger value="audit" onClick={() => setFilters(prev => ({ ...prev, reportType: 'audit' }))}>
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="leave" onClick={() => setFilters(prev => ({ ...prev, reportType: 'leave' }))}>
            Leave Reports
          </TabsTrigger>
          <TabsTrigger value="schedules" onClick={() => setFilters(prev => ({ ...prev, reportType: 'schedules' }))}>
            Schedule Reports
          </TabsTrigger>
          <TabsTrigger value="rooms" onClick={() => setFilters(prev => ({ ...prev, reportType: 'rooms' }))}>
            Room Activity
          </TabsTrigger>
          <TabsTrigger value="locks">
            Timesheet Locks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timesheet" className="space-y-6">
          {reportData.length > 0 && (
            <ReportCharts
              reportData={reportData}
              projects={[]}
              users={users}
              isLoading={isLoading}
            />
          )}
          <ReportDataTable
            reportData={reportData}
            filters={filters}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogsTable auditData={auditData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="leave">
          <LeaveReportsSection leaveData={leaveData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="schedules">
          <ScheduleReportsSection scheduleData={scheduleData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="rooms">
          <RoomActivityReports roomData={roomData} isLoading={isLoading} />
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
