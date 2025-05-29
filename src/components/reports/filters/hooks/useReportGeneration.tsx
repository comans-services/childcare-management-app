
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchReportData } from "@/lib/timesheet-service";
import { toast } from "@/hooks/use-toast";
import { ReportFiltersType } from "@/pages/ReportsPage";

interface UseReportGenerationProps {
  filters: ReportFiltersType;
  setReportData: React.Dispatch<React.SetStateAction<any[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useReportGeneration = ({
  filters,
  setReportData,
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
    
    // Normalize filters before sending to backend
    const normalizedFilters = {
      userId: normalizeSelectValue(filters.userId),
      projectId: normalizeSelectValue(filters.projectId),
      customerId: normalizeSelectValue(filters.customerId),
      contractId: normalizeSelectValue(filters.contractId)
    };
    
    console.log("Normalized filters for backend:", normalizedFilters);
    
    setIsGeneratingReport(true);
    setIsLoading(true);
    
    try {
      // Call fetchReportData with normalized filters
      const reportData = await fetchReportData(filters.startDate, filters.endDate, normalizedFilters);
      
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

  return {
    generateReport,
    isGeneratingReport,
    normalizeSelectValue
  };
};
