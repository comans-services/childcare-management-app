import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Calendar, Users, BarChart3, PieChart } from "lucide-react";
import { LeaveAnalyticsService, LeaveUsageAnalytics, LeaveBalanceAnalytics, LeaveTrend } from "@/lib/leave/analytics-service";
import { useToast } from "@/hooks/use-toast";

const LeaveAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [usageAnalytics, setUsageAnalytics] = useState<LeaveUsageAnalytics | null>(null);
  const [balanceAnalytics, setBalanceAnalytics] = useState<LeaveBalanceAnalytics | null>(null);
  const [trends, setTrends] = useState<LeaveTrend[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 12); // Last 12 months
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [usage, balance, trends] = await Promise.all([
        LeaveAnalyticsService.getLeaveUsageAnalytics(startDate, endDate),
        LeaveAnalyticsService.getLeaveBalanceAnalytics(),
        LeaveAnalyticsService.getLeaveTrends(startDate, endDate, 'month')
      ]);

      setUsageAnalytics(usage);
      setBalanceAnalytics(balance);
      setTrends(trends);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalytics();
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return "text-red-600";
    if (rate >= 60) return "text-orange-600";
    if (rate >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Date Range Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Leave Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleRefresh} disabled={loading}>
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading analytics...</div>
      ) : (
        <>
          {/* Usage Analytics */}
          {usageAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                      <p className="text-2xl font-bold">{usageAnalytics.totalApplications}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                      <p className="text-2xl font-bold">
                        {usageAnalytics.totalApplications > 0
                          ? formatPercentage((usageAnalytics.approvedApplications / usageAnalytics.totalApplications) * 100)
                          : "0%"
                        }
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Days Approved</p>
                      <p className="text-2xl font-bold">{usageAnalytics.totalDaysApproved}</p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Days/Application</p>
                      <p className="text-2xl font-bold">
                        {usageAnalytics.averageDaysPerApplication.toFixed(1)}
                      </p>
                    </div>
                    <PieChart className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Application Status Breakdown */}
          {usageAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>Application Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {usageAnalytics.approvedApplications}
                    </div>
                    <Badge variant="outline" className="mt-1">Approved</Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {usageAnalytics.pendingApplications}
                    </div>
                    <Badge variant="outline" className="mt-1">Pending</Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {usageAnalytics.rejectedApplications}
                    </div>
                    <Badge variant="outline" className="mt-1">Rejected</Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-medium text-muted-foreground">
                      Popular: {usageAnalytics.mostPopularLeaveType}
                    </div>
                    <Badge variant="secondary" className="mt-1">Most Used</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Balance Analytics */}
          {balanceAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>Leave Balance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{balanceAnalytics.totalAllocated}</div>
                    <div className="text-sm text-muted-foreground">Total Allocated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{balanceAnalytics.totalUsed}</div>
                    <div className="text-sm text-muted-foreground">Total Used</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getUtilizationColor(balanceAnalytics.utilizationRate)}`}>
                      {formatPercentage(balanceAnalytics.utilizationRate)}
                    </div>
                    <div className="text-sm text-muted-foreground">Utilization Rate</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">By Leave Type</h4>
                  {balanceAnalytics.byLeaveType.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.leaveType}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.used} / {item.allocated} days used
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${getUtilizationColor(item.utilizationRate)}`}>
                          {formatPercentage(item.utilizationRate)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.remaining} remaining
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trends */}
          {trends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trends.slice(-6).map((trend, index) => {
                    const previousTrend = index > 0 ? trends[trends.indexOf(trend) - 1] : null;
                    return (
                      <div key={trend.period} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">{trend.period}</div>
                          {previousTrend && getTrendIcon(trend.applications, previousTrend.applications)}
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">Applications: </span>
                            <span className="font-medium">{trend.applications}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Days: </span>
                            <span className="font-medium">{trend.daysRequested}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Approval Rate: </span>
                            <span className="font-medium">{formatPercentage(trend.approvalRate)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Peak Usage Insights */}
          {usageAnalytics && usageAnalytics.peakUsageMonths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Peak Usage Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Peak Usage Months: </span>
                    {usageAnalytics.peakUsageMonths.map((month, index) => (
                      <Badge key={month} variant="secondary" className="ml-1">
                        {month}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    These months show the highest leave application activity. Consider staffing adjustments during these periods.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default LeaveAnalyticsDashboard;