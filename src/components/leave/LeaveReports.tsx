import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LeaveReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("leave-summary");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [format, setFormat] = useState("pdf");
  const { toast } = useToast();

  const reportTypes = [
    { value: "leave-summary", label: "Leave Summary Report", description: "Overview of all leave applications and balances" },
    { value: "leave-balance", label: "Leave Balance Report", description: "Current leave balances by employee and type" },
    { value: "leave-usage", label: "Leave Usage Report", description: "Detailed leave usage patterns and trends" },
    { value: "leave-calendar", label: "Leave Calendar Report", description: "Calendar view of approved leave periods" },
    { value: "leave-analytics", label: "Leave Analytics Report", description: "Statistical analysis of leave patterns" }
  ];

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // Placeholder for report generation logic
      // In a real implementation, this would call the leave analytics service
      // and generate the appropriate report format
      
      toast({
        title: "Report Generated",
        description: `${reportTypes.find(r => r.value === reportType)?.label} has been generated successfully.`,
      });
      
      // Simulate download
      const filename = `leave-report-${reportType}-${new Date().toISOString().split('T')[0]}.${format}`;
      console.log(`Generating report: ${filename}`);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedReport = reportTypes.find(r => r.value === reportType);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Leave Reports
          </CardTitle>
          <CardDescription>
            Generate comprehensive leave reports for analysis and compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedReport && (
                <p className="text-sm text-muted-foreground">
                  {selectedReport.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleGenerateReport}
              disabled={loading || !startDate || !endDate}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
          <CardDescription>
            Pre-configured reports for common use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => {
                setReportType("leave-summary");
                const today = new Date();
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                setStartDate(lastMonth.toISOString().split('T')[0]);
                setEndDate(endOfLastMonth.toISOString().split('T')[0]);
              }}
            >
              <Calendar className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Last Month Summary</div>
                <div className="text-sm text-muted-foreground">Complete leave overview</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => {
                setReportType("leave-balance");
                const today = new Date();
                setStartDate(new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
              }}
            >
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Current Balances</div>
                <div className="text-sm text-muted-foreground">Year-to-date balances</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => {
                setReportType("leave-analytics");
                const today = new Date();
                const lastYear = new Date(today.getFullYear() - 1, 0, 1);
                setStartDate(lastYear.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
              }}
            >
              <Download className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Annual Analytics</div>
                <div className="text-sm text-muted-foreground">12-month trend analysis</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Schedule (Future Enhancement) */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>
            Automated report generation and delivery (Coming Soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Scheduled reporting will be available in a future update.</p>
            <p className="text-sm">Set up automatic monthly, quarterly, or annual leave reports.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveReports;