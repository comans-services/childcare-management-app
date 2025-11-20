
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchReportData } from "@/lib/timesheet-service";
import { fetchAuditLogs, logAuditEvent } from "@/lib/audit/audit-service";
import { fetchLeaveReportData } from "@/lib/reports/leave-report-service";
import { fetchScheduleReportData } from "@/lib/reports/schedule-report-service";
import { fetchRoomActivityReportData } from "@/lib/reports/room-activity-report-service";
import { toast } from "@/hooks/use-toast";
import { ReportFiltersType } from "@/pages/ReportsPage";

interface UseReportGenerationProps {
  filters: ReportFiltersType;
  setReportData: React.Dispatch<React.SetStateAction<any[]>>;
  setAuditData: React.Dispatch<React.SetStateAction<any[]>>;
  setLeaveData?: React.Dispatch<React.SetStateAction<any>>;
  setScheduleData?: React.Dispatch<React.SetStateAction<any>>;
  setRoomData?: React.Dispatch<React.SetStateAction<any>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useReportGeneration = ({
  filters,
  setReportData,
  setAuditData,
  setLeaveData,
  setScheduleData,
  setRoomData,
  setIsLoading
}: UseReportGenerationProps) => {
  const { user } = useAuth();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Improved filter value normalization function
  const normalizeSelectValue = (value: string | undefined): string | null => {
    // Convert any "empty" values to null for proper filtering
    if (!value || value === "" || value === "all" || value === "empty") {
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
    console.log("Raw filters:", filters);
    
    setIsGeneratingReport(true);
    setIsLoading(true);
    
    try {
      if (filters.reportType === 'timesheet') {
        const normalizedFilters = {
          startDate: filters.startDate,
          endDate: filters.endDate,
          userIds: filters.userIds?.filter(id => id),
          includeEmployeeData: true
        };
        
        const reportData = await fetchReportData(normalizedFilters);
        setReportData(reportData);
        setAuditData([]);
        setLeaveData?.({});
        setScheduleData?.({});
        setRoomData?.({});
        
        await logAuditEvent({
          action: "timesheet_report_generated",
          details: {
            report_type: "timesheet",
            start_date: filters.startDate.toISOString(),
            end_date: filters.endDate.toISOString(),
            user_ids: filters.userIds,
            result_count: reportData.length
          }
        });
        
        toast({
          title: reportData.length > 0 ? "Report generated successfully" : "No data found",
          description: reportData.length > 0 ? `Found ${reportData.length} timesheet entries` : "No timesheet entries found for the selected criteria.",
          variant: "default"
        });
      } else if (filters.reportType === 'audit') {
        const auditLogs = await fetchAuditLogs(filters);
        setAuditData(auditLogs);
        setReportData([]);
        setLeaveData?.({});
        setScheduleData?.({});
        setRoomData?.({});
        
        await logAuditEvent({
          action: "audit_report_generated",
          details: {
            report_type: "audit",
            start_date: filters.startDate.toISOString(),
            end_date: filters.endDate.toISOString(),
            action_type_filter: filters.actionType || null,
            result_count: auditLogs.length
          }
        });
        
        toast({
          title: "Audit logs loaded",
          description: `Found ${auditLogs.length} audit log entries`,
          variant: "default"
        });
      } else if (filters.reportType === 'leave') {
        const leaveData = await fetchLeaveReportData({
          startDate: filters.startDate,
          endDate: filters.endDate,
          userIds: filters.userIds?.filter(id => id),
        });
        setLeaveData?.(leaveData);
        setReportData([]);
        setAuditData([]);
        setScheduleData?.({});
        setRoomData?.({});
        
        await logAuditEvent({
          action: "leave_report_generated",
          details: {
            report_type: "leave",
            start_date: filters.startDate.toISOString(),
            end_date: filters.endDate.toISOString(),
            user_ids: filters.userIds,
            result_count: leaveData.applications.length
          }
        });
        
        toast({
          title: "Leave report generated",
          description: `Found ${leaveData.applications.length} leave applications`,
          variant: "default"
        });
      } else if (filters.reportType === 'schedules') {
        const scheduleData = await fetchScheduleReportData({
          startDate: filters.startDate,
          endDate: filters.endDate,
          userIds: filters.userIds?.filter(id => id),
        });
        setScheduleData?.(scheduleData);
        setReportData([]);
        setAuditData([]);
        setLeaveData?.({});
        setRoomData?.({});
        
        await logAuditEvent({
          action: "schedule_report_generated",
          details: {
            report_type: "schedules",
            start_date: filters.startDate.toISOString(),
            end_date: filters.endDate.toISOString(),
            user_ids: filters.userIds,
            result_count: scheduleData.weeklySchedules.length
          }
        });
        
        toast({
          title: "Schedule report generated",
          description: `Found ${scheduleData.weeklySchedules.length} weekly schedules`,
          variant: "default"
        });
      } else if (filters.reportType === 'rooms') {
        const roomData = await fetchRoomActivityReportData({
          startDate: filters.startDate,
          endDate: filters.endDate,
          roomIds: filters.roomIds?.filter(id => id),
          staffIds: filters.userIds?.filter(id => id),
        });
        setRoomData?.(roomData);
        setReportData([]);
        setAuditData([]);
        setLeaveData?.({});
        setScheduleData?.({});
        
        await logAuditEvent({
          action: "room_activity_report_generated",
          details: {
            report_type: "room_activity",
            start_date: filters.startDate.toISOString(),
            end_date: filters.endDate.toISOString(),
            room_ids: filters.roomIds,
            staff_ids: filters.userIds,
            result_count: roomData.staffEntries.length
          }
        });
        
        toast({
          title: "Room activity report generated",
          description: `Found ${roomData.staffEntries.length} room entries`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setReportData([]);
      setAuditData([]);
      
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

  return {
    generateReport,
    isGeneratingReport,
    normalizeSelectValue
  };
};
