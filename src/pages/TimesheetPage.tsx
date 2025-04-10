
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WeeklyView from "@/components/timesheet/WeeklyView";

const TimesheetPage = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Timesheet</h1>
        <p className="text-gray-600">Track and manage your working hours</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
          <CardDescription>Your time entries for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <WeeklyView />
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">Please sign in to view your timesheet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimesheetPage;
