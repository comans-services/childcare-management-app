import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WeeklyView from "@/components/timesheet/WeeklyView";
import TimerComponent from "@/components/timesheet/TimerComponent";
import { useSimpleWeeklySchedule } from "@/hooks/useSimpleWeeklySchedule";
import { getWeekStart } from "@/lib/date-utils";
import { fetchUsers, User as UserType } from "@/lib/user-service";
import { useQuery } from "@tanstack/react-query";
import { isAdmin } from "@/utils/roles";

const TimesheetPage = () => {
  const { user, userRole } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Check for URL parameters to set initial user selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('userId');
    if (userIdParam && isAdminUser) {
      setSelectedUserId(userIdParam);
      // Clean up URL without causing page reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isAdminUser]);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const adminStatus = await isAdmin(user);
        setIsAdminUser(adminStatus);
      }
    };
    checkAdminStatus();
  }, [user]);

  // Fetch users for getting selected user details
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    enabled: isAdminUser
  });

  // Get current week's schedule for the selected user or current user
  const targetUserId = selectedUserId || user?.id || "";
  const weekStartDate = getWeekStart(new Date());
  const {
    effectiveDays,
    effectiveHours
  } = useSimpleWeeklySchedule(targetUserId, weekStartDate);

  // Get selected user details for display
  const selectedUser = selectedUserId ? users.find(u => u.id === selectedUserId) : null;
  const displayUserName = selectedUser?.full_name || selectedUser?.email || "My";

  // Redirect if no user is authenticated
  if (!user) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="py-8 text-center">
          <p className="text-gray-500">Please sign in to view your timesheet</p>
        </div>
      </div>
    );
  }

  const handleUserChange = (userId: string | null) => {
    setSelectedUserId(userId);
    setRefreshKey(prev => prev + 1); // Force refresh when switching users
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:px-20 4xl:px-24 max-w-full mx-auto">
      {/* Header section with improved mobile spacing */}
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {selectedUserId ? `${displayUserName}'s Timesheet` : "My Timesheet"}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg mt-2">
            {selectedUserId ? `View and manage ${displayUserName.toLowerCase()}'s working hours` : "Track and manage your working hours"}
            <span className="hidden sm:inline"> - {effectiveDays} days</span>
          </p>
        </div>
        
        {/* Removed: User Selector and Reset All Entries button */}
      </div>

      {/* Mobile timer with proper spacing - only show for current user */}
      {isMobile && !selectedUserId && (
        <div className="mb-6">
          <TimerComponent />
        </div>
      )}

      {/* Removed: Holiday Legend */}

      {/* Weekly overview card with expanded width for larger screens */}
      <Card className="mb-6 lg:mb-8 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden border-t-4 border-t-primary w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold">
            Weekly Overview
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {selectedUserId ? `${displayUserName}'s time entries for the current week` : "Your time entries for the current week"}
            <span className="hidden lg:inline"> - {effectiveDays} days expected per week</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {/* Pass viewAsUserId to WeeklyView */}
          <WeeklyView key={refreshKey} viewAsUserId={selectedUserId} />
        </CardContent>
      </Card>

      {/* Desktop timer with consistent spacing - only show for current user */}
      {!isMobile && !selectedUserId && (
        <div className="hidden md:block">
          <TimerComponent />
        </div>
      )}

      {/* Removed: Delete confirmation dialog */}
    </div>
  );
};

export default TimesheetPage;
