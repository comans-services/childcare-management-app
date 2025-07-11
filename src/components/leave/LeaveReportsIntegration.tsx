import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeaveBalanceManagementService } from "@/lib/leave/balance-management-service";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Calendar, Download, TrendingUp, Users, Clock } from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const LeaveReportsIntegration: React.FC = () => {
  const [reportPeriod, setReportPeriod] = useState('current-month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Calculate date range based on period
  const getDateRange = () => {
    const now = new Date();
    switch (reportPeriod) {
      case 'current-month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return {
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
        };
      case 'last-3-months':
        return {
          start: format(subMonths(now, 3), 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd')
        };
      case 'year-to-date':
        return {
          start: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd')
        };
      default:
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
    }
  };

  const dateRange = getDateRange();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['leave-analytics', dateRange.start, dateRange.end],
    queryFn: () => LeaveBalanceManagementService.getLeaveAnalytics(dateRange.start, dateRange.end),
  });

  const { data: calendarData } = useQuery({
    queryKey: ['leave-calendar-data', dateRange.start, dateRange.end],
    queryFn: () => LeaveBalanceManagementService.getTeamLeaveCalendar(dateRange.start, dateRange.end),
  });

  const { data: currentBalances } = useQuery({
    queryKey: ['current-balances', new Date().getFullYear()],
    queryFn: () => LeaveBalanceManagementService.getAllUserBalances(new Date().getFullYear()),
  });

  // Chart data preparation
  const leaveTypeChartData = {
    labels: Object.keys(analytics?.byLeaveType || {}),
    datasets: [{
      label: 'Days Used',
      data: Object.values(analytics?.byLeaveType || {}),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(6, 182, 212, 0.8)',
      ],
    }]
  };

  const monthlyTrendData = {
    labels: Object.keys(analytics?.byMonth || {}),
    datasets: [{
      label: 'Leave Days',
      data: Object.values(analytics?.byMonth || {}),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }]
  };

  const exportReport = async () => {
    // Prepare CSV data
    const csvData = [
      ['Leave Usage Report', `Period: ${dateRange.start} to ${dateRange.end}`],
      [''],
      ['Summary'],
      ['Total Applications', analytics?.totalApplications || 0],
      ['Total Days Used', analytics?.totalDaysUsed || 0],
      ['Average Days Per User', analytics?.averageDaysPerUser?.toFixed(1) || 0],
      [''],
      ['By Leave Type'],
      ['Leave Type', 'Days Used'],
      ...Object.entries(analytics?.byLeaveType || {}).map(([type, days]) => [type, days]),
      [''],
      ['By Month'],
      ['Month', 'Days Used'],
      ...Object.entries(analytics?.byMonth || {}).map(([month, days]) => [month, days]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leave-report-${dateRange.start}-to-${dateRange.end}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="p-4">Loading leave reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Leave Reports & Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive leave usage insights and trends
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="year-to-date">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalApplications || 0}</div>
            <p className="text-xs text-muted-foreground">
              Leave applications submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Days Used</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalDaysUsed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Business days of leave taken
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Days/User</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.averageDaysPerUser?.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Average leave per employee
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Type</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {analytics?.byLeaveType ? 
                Object.entries(analytics.byLeaveType).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A' 
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Most popular leave type
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leave Usage by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics?.byLeaveType || {}).length > 0 ? (
              <Pie 
                data={leaveTypeChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No leave data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics?.byMonth || {}).length > 0 ? (
              <Bar 
                data={monthlyTrendData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No monthly trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Leave Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leave Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {calendarData && calendarData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calendarData.slice(0, 10).map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">
                      {leave.title.split(' - ')[0]}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {leave.title.split(' - ')[1]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(leave.start), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(leave.end), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {leave.businessDays} day{leave.businessDays !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {leave.reason || 'No reason provided'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No leave applications found for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Balances Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Leave Balances Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {currentBalances && currentBalances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Annual Leave', 'Sick Leave', 'Personal Leave'].map(leaveTypeName => {
                const typeBalances = currentBalances.filter(b => b.leave_types?.name === leaveTypeName);
                const totalAllocated = typeBalances.reduce((sum, b) => sum + b.total_days, 0);
                const totalUsed = typeBalances.reduce((sum, b) => sum + b.used_days, 0);
                const totalRemaining = totalAllocated - totalUsed;
                
                return (
                  <div key={leaveTypeName} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{leaveTypeName}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Allocated:</span>
                        <span className="font-medium">{totalAllocated} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Used:</span>
                        <span className="font-medium">{totalUsed} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Remaining:</span>
                        <span className="font-medium text-green-600">{totalRemaining} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Usage Rate:</span>
                        <span className="font-medium">
                          {totalAllocated > 0 ? ((totalUsed / totalAllocated) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No balance data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveReportsIntegration;