
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchReportData } from "@/lib/timesheet-service";
import { fetchAuditLogs, logReportGeneration } from "@/lib/audit/audit-service";
import { LeaveAnalyticsService } from "@/lib/leave/analytics-service";
import { toast } from "@/hooks/use-toast";
import { ReportFiltersType } from "@/pages/ReportsPage";

interface UseReportGenerationProps {
  filters: ReportFiltersType;
  setReportData: React.Dispatch<React.SetStateAction<any[]>>;
  setAuditData: React.Dispatch<React.SetStateAction<any[]>>;
  setLeaveData: React.Dispatch<React.SetStateAction<any>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useReportGeneration = ({
  filters,
  setReportData,
  setAuditData,
  setLeaveData,
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
        // Handle timesheet reports with entry type filtering
        const normalizedFilters = {
          userId: normalizeSelectValue(filters.userId),
          projectId: filters.includeProject ? normalizeSelectValue(filters.projectId) : null,
          customerId: normalizeSelectValue(filters.customerId),
          contractId: filters.includeContract ? normalizeSelectValue(filters.contractId) : null,
          includeProjects: filters.includeProject,
          includeContracts: filters.includeContract
        };
        
        console.log("Normalized timesheet filters:", normalizedFilters);
        
        const reportData = await fetchReportData(filters.startDate, filters.endDate, normalizedFilters);
        
        console.log("Timesheet report data received:", reportData);
        setReportData(reportData);
        setAuditData([]); // Clear audit data when generating timesheet report
        setLeaveData(null); // Clear leave data when generating timesheet report
        
        // Log report generation to audit trail using secure database function
        await logReportGeneration({
          reportType: 'timesheet',
          filters: {
            ...normalizedFilters,
            startDate: filters.startDate.toISOString().split('T')[0],
            endDate: filters.endDate.toISOString().split('T')[0],
            includeProject: filters.includeProject,
            includeContract: filters.includeContract
          },
          resultCount: reportData.length
        });
        
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
      } else if (filters.reportType === 'audit') {
        // Handle audit log reports
        const auditFilters = {
          startDate: filters.startDate,
          endDate: filters.endDate,
          userId: normalizeSelectValue(filters.userId),
          actionType: normalizeSelectValue(filters.actionType)
        };
        
        console.log("Audit log filters:", auditFilters);
        
        const auditData = await fetchAuditLogs(auditFilters);
        
        console.log("Audit log data received:", auditData);
        setAuditData(auditData);
        setReportData([]); // Clear timesheet data when generating audit report
        setLeaveData(null); // Clear leave data when generating audit report
        
        // Log audit report generation to audit trail using secure database function
        await logReportGeneration({
          reportType: 'audit',
          filters: {
            startDate: filters.startDate.toISOString().split('T')[0],
            endDate: filters.endDate.toISOString().split('T')[0],
            userId: normalizeSelectValue(filters.userId),
            actionType: normalizeSelectValue(filters.actionType)
          },
          resultCount: auditData.length
        });
        
        if (auditData.length === 0) {
          toast({
            title: "No audit logs found",
            description: "No audit entries found for the selected criteria. Try adjusting your filters.",
            variant: "default"
          });
        } else {
          toast({
            title: "Audit report generated successfully",
            description: `Found ${auditData.length} audit log entries`,
            variant: "default"
          });
        }
      } else if (filters.reportType === 'leave') {
        // Handle leave reports using LeaveAnalyticsService
        const leaveAnalytics = new LeaveAnalyticsService();
        let leaveData;
        
        const userId = normalizeSelectValue(filters.userId);
        
        try {
          switch (filters.leaveReportType) {
            case 'usage':
              leaveData = await LeaveAnalyticsService.getLeaveUsageAnalytics(
                filters.startDate.toISOString().split('T')[0],
                filters.endDate.toISOString().split('T')[0],
                userId
              );
              break;
            case 'balance':
              leaveData = await LeaveAnalyticsService.getLeaveBalanceAnalytics(
                filters.leaveYear || new Date().getFullYear(),
                userId
              );
              break;
            case 'calendar':
              leaveData = await LeaveAnalyticsService.getTeamLeaveCalendar(
                filters.startDate.toISOString().split('T')[0],
                filters.endDate.toISOString().split('T')[0]
              );
              break;
            case 'trends':
              leaveData = await LeaveAnalyticsService.getLeaveTrends(
                filters.startDate.toISOString().split('T')[0],
                filters.endDate.toISOString().split('T')[0],
                filters.leaveGroupBy || 'month'
              );
              break;
            case 'summary':
              // Get both usage and balance data for summary
              const [usageData, balanceData] = await Promise.all([
                LeaveAnalyticsService.getLeaveUsageAnalytics(
                  filters.startDate.toISOString().split('T')[0],
                  filters.endDate.toISOString().split('T')[0],
                  userId
                ),
                LeaveAnalyticsService.getLeaveBalanceAnalytics(
                  filters.leaveYear || new Date().getFullYear(),
                  userId
                )
              ]);
              leaveData = { usage: usageData, balance: balanceData };
              break;
            default:
              throw new Error('Invalid leave report type');
          }
          
          setLeaveData(leaveData);
          setReportData([]); // Clear timesheet data when generating leave report
          setAuditData([]); // Clear audit data when generating leave report
          
          // Log leave report generation to audit trail
          await logReportGeneration({
            reportType: 'leave',
            filters: {
              startDate: filters.startDate.toISOString().split('T')[0],
              endDate: filters.endDate.toISOString().split('T')[0],
              userId,
              leaveReportType: filters.leaveReportType,
              leaveYear: filters.leaveYear,
              leaveGroupBy: filters.leaveGroupBy
            },
            resultCount: Array.isArray(leaveData) ? leaveData.length : 1
          });
          
          toast({
            title: "Leave report generated successfully",
            description: `Generated ${filters.leaveReportType} report`,
            variant: "default"
          });
          
        } catch (leaveError) {
          console.error("Error generating leave report:", leaveError);
          setLeaveData(null);
          throw leaveError;
        }
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setReportData([]);
      setAuditData([]);
      setLeaveData(null);
      
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
