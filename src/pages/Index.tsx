import React from "react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { useDashboardData } from "@/hooks/useDashboardData";
import { TimesheetReminder } from "@/components/dashboard/TimesheetReminder";
import { CompanyNews } from "@/components/dashboard/CompanyNews";
import { HelpAndSupport } from "@/components/dashboard/HelpAndSupport";
import PendingApprovalsCard from "@/components/admin/PendingApprovalsCard";

const Index = () => {
  const { dashboardData, isLoading, error } = useDashboardData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Here's a snapshot of your key metrics and important updates.
          </p>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats 
          totalHours={dashboardData.totalHours}
          totalProjects={dashboardData.totalProjects}
          daysWorked={dashboardData.daysWorked}
          isLoading={isLoading}
        />

        {/* Add Pending Approvals Card for Admins */}
        <PendingApprovalsCard />

        {/* Grid Layout for main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Charts and Graphs (Placeholder) */}
          <div className="col-span-1 lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Key Performance Indicators
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Interactive charts and graphs will be displayed here.
              </p>
            </div>
          </div>

          {/* Timesheet Reminder */}
          <div>
            <TimesheetReminder />
          </div>
        </div>

        {/* Company News and Announcements */}
        <CompanyNews />

        {/* Help and Support Section */}
        <HelpAndSupport />
      </div>
    </div>
  );
};

export default Index;
