import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeaveApplicationForm from "@/components/leave/LeaveApplicationForm";
import LeaveBalanceDisplay from "@/components/leave/LeaveBalanceDisplay";
import LeaveHistoryTable from "@/components/leave/LeaveHistoryTable";
import { useAuth } from "@/context/AuthContext";

const LeaveApplicationPage = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Application</h1>
          <p className="text-muted-foreground">
            Apply for leave and manage your leave balance
          </p>
        </div>
      </div>

      <Tabs defaultValue="apply" className="space-y-6">
        <TabsList>
          <TabsTrigger value="apply">Apply for Leave</TabsTrigger>
          <TabsTrigger value="balance">Leave Balance</TabsTrigger>
          <TabsTrigger value="history">Leave History</TabsTrigger>
        </TabsList>

        <TabsContent value="apply" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New Leave Application</CardTitle>
              <CardDescription>
                Submit a new leave application. All leave requests require admin approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveApplicationForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Leave Balance</CardTitle>
              <CardDescription>
                View your available leave days for the current year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveBalanceDisplay userId={user?.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave History</CardTitle>
              <CardDescription>
                View all your past and current leave applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveHistoryTable userId={user?.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaveApplicationPage;