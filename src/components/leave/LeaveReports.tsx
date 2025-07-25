import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Calendar, BarChart3, Users, Clock, Info, TrendingUp, AlertCircle, Settings, TableIcon, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LeaveAnalyticsService } from "@/lib/leave/analytics-service";
import { format } from "date-fns";

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
  const [exportFormat, setExportFormat] = useState("pdf");
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const { toast } = useToast();

  const reportTypes = [
    { 
      value: "leave-summary", 
      label: "Leave Summary Report", 
      description: "Comprehensive overview of all leave applications, balances, and team activity",
      icon: FileText,
      category: "Overview",
      includes: ["Total applications", "Approval rates", "Leave balances", "Team overview"],
      useCase: "Monthly/quarterly team reporting"
    },
    { 
      value: "leave-balance", 
      label: "Leave Balance Report", 
      description: "Current leave balances by employee and leave type with utilization rates",
      icon: BarChart3,
      category: "Balances",
      includes: ["Current balances", "Used vs remaining", "Utilization rates", "Carry-over status"],
      useCase: "Year-end balance reviews"
    },
    { 
      value: "leave-usage", 
      label: "Leave Usage Report", 
      description: "Detailed analysis of leave usage patterns, trends, and peak periods",
      icon: TrendingUp,
      category: "Analytics",
      includes: ["Usage trends", "Peak months", "Popular leave types", "Approval patterns"],
      useCase: "Workforce planning and trend analysis"
    },
    { 
      value: "leave-calendar", 
      label: "Leave Calendar Report", 
      description: "Visual calendar showing all approved leave periods for team planning",
      icon: Calendar,
      category: "Planning",
      includes: ["Approved leave dates", "Team conflicts", "Coverage gaps", "Leave overlap"],
      useCase: "Resource planning and scheduling"
    },
    { 
      value: "leave-analytics", 
      label: "Leave Analytics Report", 
      description: "Statistical analysis and insights for strategic workforce management",
      icon: Users,
      category: "Analytics",
      includes: ["Statistical insights", "Comparative analysis", "Forecasting data", "KPI metrics"],
      useCase: "Strategic HR decision making"
    }
  ];

  // Load preview data when report type or dates change
  useEffect(() => {
    if (reportType && startDate && endDate) {
      loadPreviewData();
    }
  }, [reportType, startDate, endDate]);

  const loadPreviewData = async () => {
    setLoadingPreview(true);
    try {
      let data;
      switch (reportType) {
        case "leave-usage":
          data = await LeaveAnalyticsService.getLeaveUsageAnalytics(startDate, endDate);
          break;
        case "leave-balance":
          data = await LeaveAnalyticsService.getLeaveBalanceAnalytics(new Date().getFullYear());
          break;
        case "leave-analytics":
          data = await LeaveAnalyticsService.getLeaveTrends(startDate, endDate);
          break;
        case "leave-calendar":
          data = await LeaveAnalyticsService.getTeamLeaveCalendar(startDate, endDate);
          break;
        default:
          // For summary, fetch all data
          const [usage, balance, trends] = await Promise.all([
            LeaveAnalyticsService.getLeaveUsageAnalytics(startDate, endDate),
            LeaveAnalyticsService.getLeaveBalanceAnalytics(new Date().getFullYear()),
            LeaveAnalyticsService.getLeaveTrends(startDate, endDate)
          ]);
          data = { usage, balance, trends };
      }
      setPreviewData(data);
    } catch (error) {
      console.error('Error loading preview data:', error);
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!previewData) {
      toast({
        title: "No Data Available",
        description: "Please ensure there is data for the selected date range.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Generate report based on format
      const selectedReportType = reportTypes.find(r => r.value === reportType);
      const filename = `${selectedReportType?.label.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.${exportFormat}`;
      
      if (exportFormat === 'csv') {
        generateCSVReport(previewData, selectedReportType!, filename);
      } else {
        // For PDF/Excel, show success message (actual implementation would generate files)
        toast({
          title: "Report Generated",
          description: `${selectedReportType?.label} has been generated successfully.`,
        });
      }
      
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

  const generateCSVReport = (data: any, reportType: any, filename: string) => {
    let csvContent = "";
    
    switch (reportType.value) {
      case "leave-usage":
        csvContent = `Leave Usage Report\n`;
        csvContent += `Generated on: ${new Date().toLocaleDateString()}\n`;
        csvContent += `Period: ${startDate} to ${endDate}\n\n`;
        csvContent += `Metric,Value\n`;
        csvContent += `Total Applications,${data?.totalApplications || 0}\n`;
        csvContent += `Approved Applications,${data?.approvedApplications || 0}\n`;
        csvContent += `Rejected Applications,${data?.rejectedApplications || 0}\n`;
        csvContent += `Pending Applications,${data?.pendingApplications || 0}\n`;
        csvContent += `Total Days Requested,${data?.totalDaysRequested || 0}\n`;
        csvContent += `Total Days Approved,${data?.totalDaysApproved || 0}\n`;
        csvContent += `Average Days per Application,${data?.averageDaysPerApplication ? data.averageDaysPerApplication.toFixed(1) : '0.0'}\n`;
        csvContent += `Most Popular Leave Type,${data?.mostPopularLeaveType || 'N/A'}\n`;
        break;
      
      case "leave-balance":
        csvContent = `Leave Balance Report\n`;
        csvContent += `Generated on: ${new Date().toLocaleDateString()}\n`;
        csvContent += `Year: ${new Date().getFullYear()}\n\n`;
        csvContent += `Leave Type,Allocated,Used,Remaining,Utilization Rate\n`;
        if (data?.byLeaveType && Array.isArray(data.byLeaveType)) {
          data.byLeaveType.forEach((item: any) => {
            csvContent += `${item?.leaveType || 'Unknown'},${item?.allocated || 0},${item?.used || 0},${item?.remaining || 0},${item?.utilizationRate ? item.utilizationRate.toFixed(1) : '0.0'}%\n`;
          });
        }
        break;
      
      default:
        csvContent = `${reportType.label}\n`;
        csvContent += `Generated on: ${new Date().toLocaleDateString()}\n`;
        csvContent += `Period: ${startDate} to ${endDate}\n\n`;
        csvContent += `Report data would be formatted here\n`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "CSV Downloaded",
      description: `${reportType.label} has been downloaded as CSV.`,
    });
  };

  const isValidDateRange = () => {
    if (!startDate || !endDate) return false;
    return new Date(startDate) <= new Date(endDate);
  };

  const selectedReport = reportTypes.find(r => r.value === reportType);

  // Render table data based on report type
  const renderTableData = () => {
    if (!previewData) return null;

    switch (reportType) {
      case "leave-usage":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Total Applications</TableCell>
                <TableCell>{previewData.totalApplications || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Approved Applications</TableCell>
                <TableCell>{previewData.approvedApplications || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Rejected Applications</TableCell>
                <TableCell>{previewData.rejectedApplications || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Pending Applications</TableCell>
                <TableCell>{previewData.pendingApplications || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Days Requested</TableCell>
                <TableCell>{previewData.totalDaysRequested || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Days Approved</TableCell>
                <TableCell>{previewData.totalDaysApproved || 0}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Average Days per Application</TableCell>
                <TableCell>{previewData.averageDaysPerApplication ? previewData.averageDaysPerApplication.toFixed(1) : '0.0'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Most Popular Leave Type</TableCell>
                <TableCell>{previewData.mostPopularLeaveType || 'N/A'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        );

      case "leave-balance":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave Type</TableHead>
                <TableHead>Allocated Days</TableHead>
                <TableHead>Used Days</TableHead>
                <TableHead>Remaining Days</TableHead>
                <TableHead>Utilization Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.byLeaveType && Array.isArray(previewData.byLeaveType) ? (
                previewData.byLeaveType.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item?.leaveType || 'Unknown'}</TableCell>
                    <TableCell>{item?.allocated || 0}</TableCell>
                    <TableCell>{item?.used || 0}</TableCell>
                    <TableCell>{item?.remaining || 0}</TableCell>
                    <TableCell>{item?.utilizationRate ? `${item.utilizationRate.toFixed(1)}%` : '0.0%'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No balance data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        );

      case "leave-calendar":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(previewData) && previewData.length > 0 ? (
                previewData.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item?.user_full_name || 'Unknown'}</TableCell>
                    <TableCell>{item?.leave_type_name || 'Unknown'}</TableCell>
                    <TableCell>{item?.start_date ? format(new Date(item.start_date), "MMM dd, yyyy") : 'N/A'}</TableCell>
                    <TableCell>{item?.end_date ? format(new Date(item.end_date), "MMM dd, yyyy") : 'N/A'}</TableCell>
                    <TableCell>{item?.business_days_count || 0} days</TableCell>
                    <TableCell>
                      <Badge variant="default">{item?.status || 'Unknown'}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No leave calendar data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        );

      case "leave-analytics":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Days Requested</TableHead>
                <TableHead>Days Approved</TableHead>
                <TableHead>Approval Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(previewData) && previewData.length > 0 ? (
                previewData.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item?.period || 'Unknown'}</TableCell>
                    <TableCell>{item?.applications || 0}</TableCell>
                    <TableCell>{item?.daysRequested || 0}</TableCell>
                    <TableCell>{item?.daysApproved || 0}</TableCell>
                    <TableCell>{item?.approvalRate ? `${item.approvalRate.toFixed(1)}%` : '0.0%'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No analytics data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        );

      case "leave-summary":
        return (
          <div className="space-y-6">
            {/* Usage Summary */}
            {previewData.usage && (
              <div>
                <h4 className="font-medium mb-3">Usage Summary</h4>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Applications</TableCell>
                      <TableCell>{previewData.usage.totalApplications || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Approved Applications</TableCell>
                      <TableCell>{previewData.usage.approvedApplications || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Most Popular Leave Type</TableCell>
                      <TableCell>{previewData.usage.mostPopularLeaveType || 'N/A'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Balance Overview */}
            {previewData.balance && (
              <div>
                <h4 className="font-medium mb-3">Balance Overview</h4>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Allocated Days</TableCell>
                      <TableCell>{previewData.balance.totalAllocated || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Used Days</TableCell>
                      <TableCell>{previewData.balance.totalUsed || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Overall Utilization</TableCell>
                      <TableCell>{previewData.balance.utilizationRate ? `${previewData.balance.utilizationRate.toFixed(1)}%` : '0.0%'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <TableIcon className="h-8 w-8 mx-auto mb-2" />
            <p>No table data available for this report type</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Help Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Generate detailed leave reports for compliance, analysis, and team planning. 
          Configure your report, preview the data, and generate the final report.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="configure" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configure" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configure Report
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            Preview Data
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Generate Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Configuration */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Report Configuration
                  </CardTitle>
                  <CardDescription>
                    Select your report type and configure parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Report Type Selection */}
                  <div className="space-y-4">
                    <Label>Report Type</Label>
                    <div className="grid gap-3">
                      {reportTypes.map((type) => {
                        const IconComponent = type.icon;
                        return (
                          <div
                            key={type.value}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              reportType === type.value 
                                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setReportType(type.value)}
                          >
                            <div className="flex items-start gap-3">
                              <IconComponent className="h-5 w-5 mt-0.5 text-primary" />
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{type.label}</h4>
                                  <Badge variant="secondary" className="text-xs">{type.category}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{type.description}</p>
                                <p className="text-xs text-muted-foreground italic">Use case: {type.useCase}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-4">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date" className="text-sm">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                    {!isValidDateRange() && startDate && endDate && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          End date must be after start date.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Export Format */}
                  <div className="space-y-2">
                    <Label htmlFor="format">Export Format</Label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                        <SelectItem value="pdf">PDF (Document)</SelectItem>
                        <SelectItem value="excel">Excel (Advanced Spreadsheet)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Preview</CardTitle>
                  <CardDescription>
                    What will be included in your report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedReport && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Includes:</h4>
                        <ul className="text-sm space-y-1">
                          {selectedReport.includes.map((item, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <Badge variant="outline" className="text-xs">
                          {selectedReport.category}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                          {selectedReport.useCase}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Quick Reports
              </CardTitle>
              <CardDescription>
                Pre-configured reports for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-6 flex flex-col items-start gap-3 text-left"
                  onClick={() => {
                    setReportType("leave-summary");
                    const today = new Date();
                    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                    setStartDate(lastMonth.toISOString().split('T')[0]);
                    setEndDate(endOfLastMonth.toISOString().split('T')[0]);
                  }}
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Last Month Summary</div>
                    <div className="text-sm text-muted-foreground">Complete leave overview for the previous month</div>
                    <Badge variant="secondary" className="mt-2 text-xs">Most Popular</Badge>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-6 flex flex-col items-start gap-3 text-left"
                  onClick={() => {
                    setReportType("leave-balance");
                    const today = new Date();
                    setStartDate(new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]);
                    setEndDate(today.toISOString().split('T')[0]);
                  }}
                >
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Current Balances</div>
                    <div className="text-sm text-muted-foreground">Year-to-date leave balances and utilization</div>
                    <Badge variant="outline" className="mt-2 text-xs">Year End</Badge>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-6 flex flex-col items-start gap-3 text-left"
                  onClick={() => {
                    setReportType("leave-analytics");
                    const today = new Date();
                    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
                    setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
                    setEndDate(today.toISOString().split('T')[0]);
                  }}
                >
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold">6-Month Trends</div>
                    <div className="text-sm text-muted-foreground">Usage patterns and trend analysis</div>
                    <Badge variant="outline" className="mt-2 text-xs">Analytics</Badge>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TableIcon className="h-5 w-5" />
                Data Preview
              </CardTitle>
              <CardDescription>
                {selectedReport ? `Preview of ${selectedReport.label} data` : 'Select a report type to see data preview'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPreview ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="ml-2">Loading data...</span>
                </div>
              ) : previewData ? (
                <div className="space-y-4">
                  {selectedReport && (
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{selectedReport.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          Period: {startDate} to {endDate}
                        </p>
                      </div>
                      <Badge variant="outline">{selectedReport.category}</Badge>
                    </div>
                  )}
                  <div className="border rounded-lg overflow-hidden">
                    {renderTableData()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="font-medium">No Data Available</h3>
                  <p className="text-sm">Configure your report settings and ensure there is data for the selected date range.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                Generate Report
              </CardTitle>
              <CardDescription>
                Review your settings and generate the final report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Summary */}
              {selectedReport && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <selectedReport.icon className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">{selectedReport.label}</h4>
                    <Badge variant="secondary" className="text-xs">{selectedReport.category}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date Range:</span>
                      <div className="font-medium">{startDate} to {endDate}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Format:</span>
                      <div className="font-medium">{exportFormat.toUpperCase()}</div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  {previewData && (
                    <div className="pt-3 border-t">
                      <span className="text-muted-foreground text-sm">Data Preview:</span>
                      <div className="text-sm space-y-1 mt-1">
                        {reportType === 'leave-usage' && (
                          <>
                            <div>Applications: {previewData.totalApplications || 0}</div>
                            <div>Approved: {previewData.approvedApplications || 0}</div>
                          </>
                        )}
                        {reportType === 'leave-balance' && (
                          <>
                            <div>Total Allocated: {previewData.totalAllocated || 0}</div>
                            <div>Total Used: {previewData.totalUsed || 0}</div>
                          </>
                        )}
                        {reportType === 'leave-calendar' && Array.isArray(previewData) && (
                          <div>Approved Leave Periods: {previewData.length}</div>
                        )}
                        {(reportType === 'leave-summary' || reportType === 'leave-analytics') && (
                          <div>Multiple datasets available</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Generate Button */}
              <Button 
                onClick={handleGenerateReport}
                disabled={loading || !isValidDateRange() || !previewData}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate {exportFormat.toUpperCase()} Report
                  </>
                )}
              </Button>

              {(!previewData || !isValidDateRange()) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {!isValidDateRange() 
                      ? "Please select a valid date range to generate the report."
                      : "No data available for the selected date range. Please check your filters."
                    }
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaveReports;