import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminApprovalInterface from "@/components/leave/AdminApprovalInterface";
import LeaveBalanceManagement from "@/components/leave/LeaveBalanceManagement";
import LeaveHistoryTable from "@/components/leave/LeaveHistoryTable";
import LeaveBalanceOperations from "@/components/leave/LeaveBalanceOperations";
import TeamLeaveCalendar from "@/components/leave/TeamLeaveCalendar";
import LeaveAnalyticsDashboard from "@/components/leave/LeaveAnalyticsDashboard";
import { Badge } from "@/components/ui/badge";

const LeaveManagementPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">
            Manage leave applications and employee leave balances
          </p>
        </div>
        <Badge variant="secondary">Admin Only</Badge>
      </div>

      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="operations">Balance Operations</TabsTrigger>
          <TabsTrigger value="calendar">Team Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="all-history">All Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Applications</CardTitle>
              <CardDescription>
                Review and approve or reject pending leave applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminApprovalInterface />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Leave Balances</CardTitle>
              <CardDescription>
                View and manage employee leave balances for the current year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveBalanceManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance Operations</CardTitle>
              <CardDescription>
                Manage annual resets, carry-over rules, and balance adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveBalanceOperations />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <TeamLeaveCalendar />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <LeaveAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="all-history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Leave Applications</CardTitle>
              <CardDescription>
                View all leave applications across the organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveHistoryTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaveManagementPage;