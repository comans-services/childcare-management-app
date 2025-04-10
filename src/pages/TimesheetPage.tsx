
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WeeklyView from "@/components/timesheet/WeeklyView";
import TimerComponent from "@/components/timesheet/TimerComponent";

const TimesheetPage = () => {
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Timesheet</h1>
        <p className="text-gray-600">Track and manage your working hours</p>
      </div>

      {/* Show timer prominently on mobile devices */}
      {isMobile && user && (
        <TimerComponent />
      )}

      <Card className="mb-6">
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

      {/* Show timer below weekly view on desktop */}
      {!isMobile && user && (
        <TimerComponent />
      )}
    </div>
  );
};

export default TimesheetPage;
