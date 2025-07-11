import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import BalanceManagementInterface from "@/components/leave/BalanceManagementInterface";
import TeamLeaveCalendar from "@/components/leave/TeamLeaveCalendar";
import LeaveReportsIntegration from "@/components/leave/LeaveReportsIntegration";
import LeaveApplicationForm from "@/components/leave/LeaveApplicationForm";
import LeaveHistoryTable from "@/components/leave/LeaveHistoryTable";
import LeaveBalanceDisplay from "@/components/leave/LeaveBalanceDisplay";
import AdminApprovalInterface from "@/components/leave/AdminApprovalInterface";
import { BarChart, Calendar, Users, Settings, FileText, UserCheck } from "lucide-react";

const LeaveManagementPage: React.FC = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager' || userRole === 'admin';

  const [activeTab, setActiveTab] = useState(isAdmin ? 'calendar' : 'my-leave');

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? "Comprehensive leave management and analytics dashboard" 
            : "Manage your leave applications and view balances"
          }
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {!isAdmin && (
            <TabsTrigger value="my-leave" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Leave
            </TabsTrigger>
          )}
          
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Team Calendar
          </TabsTrigger>
          
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Reports
          </TabsTrigger>
          
          {isManager && (
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Approvals
            </TabsTrigger>
          )}
          
          {isAdmin && (
            <>
              <TabsTrigger value="balances" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Balance Management
              </TabsTrigger>
              
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Employee Leave Tab */}
        {!isAdmin && (
          <TabsContent value="my-leave" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Leave Application Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Apply for Leave</CardTitle>
                  <CardDescription>
                    Submit a new leave application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LeaveApplicationForm />
                </CardContent>
              </Card>

              {/* Leave Balances */}
              <Card>
                <CardHeader>
                  <CardTitle>My Leave Balances</CardTitle>
                  <CardDescription>
                    Current year leave allocations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LeaveBalanceDisplay />
                </CardContent>
              </Card>
            </div>

            {/* Leave History */}
            <Card>
              <CardHeader>
                <CardTitle>Leave History</CardTitle>
                <CardDescription>
                  Your recent and past leave applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaveHistoryTable />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Team Calendar Tab */}
        <TabsContent value="calendar">
          <TeamLeaveCalendar />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <LeaveReportsIntegration />
        </TabsContent>

        {/* Approvals Tab (Managers) */}
        {isManager && (
          <TabsContent value="approvals">
            <AdminApprovalInterface />
          </TabsContent>
        )}

        {/* Balance Management Tab (Admin) */}
        {isAdmin && (
          <TabsContent value="balances">
            <BalanceManagementInterface />
          </TabsContent>
        )}

        {/* Settings Tab (Admin) */}
        {isAdmin && (
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave Management Settings</CardTitle>
                <CardDescription>
                  Configure leave types, carry-over rules, and annual reset settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Leave settings configuration interface coming soon...</p>
                  <p className="text-sm mt-2">
                    This will include leave type management, carry-over rules, and automated reset configuration.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default LeaveManagementPage;