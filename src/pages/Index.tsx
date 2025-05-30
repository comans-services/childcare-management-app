
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import DashboardStats from "@/components/dashboard/DashboardStats";
import TimesheetReminder from "@/components/dashboard/TimesheetReminder";
import ChartSection from "@/components/dashboard/ChartSection";
import CompanyNews from "@/components/dashboard/CompanyNews";
import HelpSection from "@/components/dashboard/HelpSection";
import { useSimpleWeeklySchedule } from "@/hooks/useSimpleWeeklySchedule";
import { getWeekStart } from "@/lib/date-utils";

const Dashboard = () => {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  
  // Get current week's schedule using the unified hook
  const weekStartDate = getWeekStart(new Date());
  const {
    effectiveDays: workingDays,
    effectiveHours: weeklyTarget,
    isLoading: scheduleLoading
  } = useSimpleWeeklySchedule(user?.id || "", weekStartDate);
  
  const {
    // Computed values
    expectedHoursToDate,
    hoursLoggedToDate,
    weekProgress,
    hoursRemaining,
    projectsChartData,
    customersChartData,
    deadlineMessage,
    
    // States
    completeWeek,
    hasEntries,
    allDaysHaveEntries,
    isTodayComplete,
    isLate,
    caughtUp,
    
    // Loading states
    isLoading,
    hasError,
    entriesError,
  } = useDashboardData();

  useEffect(() => {
    if (!session || !user) {
      console.log("No session or user found, redirecting to auth");
      navigate("/auth");
    }
  }, [session, user, navigate]);

  // Security check before rendering
  if (!session || !user) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="text-center text-gray-500">
          <p>Please sign in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  // Show loading while schedule is loading
  if (scheduleLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="text-center text-gray-500">
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to your timesheet dashboard - {workingDays} day work schedule ({weeklyTarget} hours/week)
        </p>
        {entriesError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error loading your timesheet data. Please refresh the page.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <TimesheetReminder
        hasEntries={hasEntries}
        completeWeek={completeWeek}
        allDaysHaveEntries={allDaysHaveEntries}
        isLate={isLate}
        weekProgress={weekProgress}
        hoursRemaining={hoursRemaining}
        caughtUp={caughtUp}
        deadlineMessage={deadlineMessage}
        workingDays={workingDays}
        weeklyTarget={weeklyTarget}
      />
      
      {isLate && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            It's Friday and you haven't entered any timesheet data yet. Please submit your hours before 5:00 PM today.
          </AlertDescription>
        </Alert>
      )}
      
      <DashboardStats
        hasEntries={hasEntries}
        expectedHoursToDate={expectedHoursToDate}
        hoursLoggedToDate={hoursLoggedToDate}
        weekProgress={weekProgress}
        completeWeek={completeWeek}
        allDaysHaveEntries={allDaysHaveEntries}
        isTodayComplete={isTodayComplete}
        workingDays={workingDays}
        weeklyTarget={weeklyTarget}
      />
      
      <ChartSection
        projectsChartData={projectsChartData}
        customersChartData={customersChartData}
        isLoading={isLoading}
        hasError={hasError}
      />
      
      <CompanyNews />
      
      <HelpSection />
    </div>
  );
};

export default Dashboard;
