
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { format, startOfWeek, addDays, getDay, isFriday, isSameDay } from "date-fns";
import { fetchTimesheetEntries, fetchUserProjects } from "@/lib/timesheet-service";
import { fetchCustomers } from "@/lib/customer-service";

export const useDashboardData = () => {
  const { session, user } = useAuth();
  const [completeWeek, setCompleteWeek] = useState(false);

  // Modified to ensure we're using Monday as the start of the week and Sunday as the end
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 }); // Start week on Monday
  const endDate = addDays(startDate, 6); // End on Sunday (6 days after Monday)
  
  const isFridayToday = isFriday(today);

  const { data: timesheetEntries = [], isLoading: entriesLoading, error: entriesError } = useQuery({
    queryKey: ["timesheet", user?.id, startDate, endDate],
    queryFn: async () => {
      if (!session?.user?.id || !user?.id) {
        console.log("No authenticated session found for dashboard");
        return Promise.resolve([]);
      }
      
      // Validate session integrity
      if (session.user.id !== user.id) {
        console.error("Session user mismatch in dashboard!", {
          sessionUserId: session.user.id,
          contextUserId: user.id
        });
        throw new Error("Session integrity error");
      }
      
      console.log(`=== DASHBOARD DATA FETCH ===`);
      console.log(`Session user: ${session.user.id} (${session.user.email})`);
      console.log(`Date Range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
      
      try {
        // RLS handles user filtering automatically - no need to pass user ID
        const result = await fetchTimesheetEntries(startDate, endDate);
        console.log(`Dashboard: Fetched ${result.length} timesheet entries via RLS`);
        
        // Additional safety check: verify all entries belong to current user
        const invalidEntries = result.filter(entry => entry.user_id !== user.id);
        if (invalidEntries.length > 0) {
          console.error("SECURITY ALERT: Dashboard received invalid entries!", {
            currentUserId: user.id,
            invalidEntries: invalidEntries.map(e => ({ id: e.id, user_id: e.user_id }))
          });
          // Filter out invalid entries
          const validEntries = result.filter(entry => entry.user_id === user.id);
          console.log(`Dashboard: Filtered to ${validEntries.length} valid entries`);
          return validEntries;
        }
        
        return result;
      } catch (err) {
        console.error("Error fetching timesheet entries for dashboard:", err);
        throw err;
      }
    },
    enabled: !!(session?.user?.id && user?.id),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      console.log("Dashboard: Fetching projects");
      try {
        const result = await fetchUserProjects();
        console.log(`Dashboard: Fetched ${result.length} projects`);
        return result;
      } catch (err) {
        console.error("Error fetching projects for dashboard:", err);
        throw err;
      }
    },
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      console.log("Dashboard: Fetching customers");
      try {
        const result = await fetchCustomers();
        console.log(`Dashboard: Fetched ${result.length} customers`);
        return result;
      } catch (err) {
        console.error("Error fetching customers for dashboard:", err);
        throw err;
      }
    },
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const totalHours = timesheetEntries?.reduce((sum, entry) => {
    const hoursLogged = Number(entry.hours_logged) || 0;
    return sum + hoursLogged;
  }, 0) || 0;
  
  const getDailyEntries = () => {
    const dailyEntries = [];
    
    // Generate entries for each day of the week (Monday to Sunday)
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      const formattedDay = format(day, "yyyy-MM-dd");
      
      const entriesForDay = timesheetEntries.filter(entry => {
        const entryDate = typeof entry.entry_date === 'string' 
          ? entry.entry_date 
          : format(entry.entry_date, "yyyy-MM-dd");
          
        return entryDate === formattedDay;
      });
      
      const hoursForDay = entriesForDay.reduce((sum, entry) => {
        const hoursLogged = Number(entry.hours_logged) || 0;
        return sum + hoursLogged;
      }, 0);
      
      dailyEntries.push({
        date: day,
        entries: entriesForDay,
        hours: hoursForDay
      });
    }
    
    return dailyEntries;
  };
  
  const dailyEntries = getDailyEntries();
  
  // Check for entries on all workdays (Monday to Friday)
  const checkDailyEntries = () => {
    return dailyEntries
      .filter((day, index) => index < 5) // Monday to Friday (first 5 days)
      .every(day => day.hours > 0);
  };
  
  const hasWorkWeekEntries = checkDailyEntries();
  const isEndOfWeek = getDay(today) >= 5; // Friday, Saturday, Sunday
  const isWeekComplete = isEndOfWeek && hasWorkWeekEntries && totalHours >= 40;
  
  useEffect(() => {
    if (isWeekComplete) {
      setCompleteWeek(true);
    }
  }, [isWeekComplete]);

  const projectHours = useMemo(() => {
    if (!timesheetEntries || timesheetEntries.length === 0) {
      console.log("Dashboard: No timesheet entries available for project hours calculation");
      return {};
    }

    const result = timesheetEntries.reduce((acc, entry) => {
      if (!entry.project_id) {
        console.log("Dashboard: Entry without project_id found:", entry);
        return acc;
      }

      const projectId = entry.project_id;
      const projectName = entry.project?.name || "Unknown Project";
      
      if (!acc[projectId]) {
        acc[projectId] = {
          name: projectName,
          hours: 0
        };
      }
      
      const hoursLogged = Number(entry.hours_logged) || 0;
      acc[projectId].hours += hoursLogged;
      
      return acc;
    }, {} as Record<string, { name: string, hours: number }>);

    console.log("Dashboard: Project hours calculation result:", result);
    return result;
  }, [timesheetEntries]);

  const customerHours = useMemo(() => {
    const result: Record<string, { name: string, hours: number }> = {};
    
    if (!timesheetEntries || !projects || !customers || 
        timesheetEntries.length === 0 || projects.length === 0) {
      console.log("Dashboard: Missing data for customer hours calculation");
      return result;
    }

    timesheetEntries.forEach(entry => {
      if (!entry.project_id) return;
      
      const project = projects.find(p => p.id === entry.project_id);
      if (!project || !project.customer_id) {
        console.log("Dashboard: Entry with missing project or customer reference:", entry);
        return;
      }
      
      const customerId = project.customer_id;
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        console.log("Dashboard: Customer not found for ID:", customerId);
        return;
      }

      const customerName = customer.name || "Unknown Customer";
      
      if (!result[customerId]) {
        result[customerId] = {
          name: customerName,
          hours: 0
        };
      }
      
      const hoursLogged = Number(entry.hours_logged) || 0;
      result[customerId].hours += hoursLogged;
    });
    
    console.log("Dashboard: Customer hours calculation result:", result);
    return result;
  }, [timesheetEntries, projects, customers]);

  const calculateExpectedHours = () => {
    if (!timesheetEntries || timesheetEntries.length === 0) {
      return 0;
    }
    
    const today = new Date();
    const dayOfWeek = getDay(today);
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 40;
    }
    
    const workDaysElapsed = Math.min(dayOfWeek, 5);
    return workDaysElapsed * 8;
  };
  
  const calculateHoursLoggedToDate = () => {
    if (!timesheetEntries || timesheetEntries.length === 0) {
      return 0;
    }
    
    const today = new Date();
    const todayFormatted = format(today, "yyyy-MM-dd");
    
    return dailyEntries
      .filter(day => {
        const dayFormatted = format(day.date, "yyyy-MM-dd");
        return dayFormatted <= todayFormatted;
      })
      .reduce((sum, day) => sum + day.hours, 0);
  };

  const expectedHoursToDate = calculateExpectedHours();
  const hoursLoggedToDate = calculateHoursLoggedToDate();
  
  const weekProgress = (timesheetEntries.length === 0) 
    ? 0
    : (expectedHoursToDate > 0 
      ? Math.min(100, (hoursLoggedToDate / expectedHoursToDate) * 100) 
      : 0);

  const calculateHoursRemaining = () => {
    const today = new Date();
    const dayOfWeek = getDay(today);
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 40 - hoursLoggedToDate;
    }
    
    return Math.max(0, expectedHoursToDate - hoursLoggedToDate);
  };
  
  const hoursRemaining = calculateHoursRemaining();
  const caughtUp = hoursLoggedToDate >= expectedHoursToDate;

  const hasEntries = timesheetEntries && timesheetEntries.length > 0;
  const isLoading = entriesLoading || projectsLoading || customersLoading;
  const hasError = !!entriesError;

  const allDaysHaveEntries = checkDailyEntries();
  const isTodayComplete = dailyEntries
    .filter(day => isSameDay(day.date, today))
    .some(day => day.hours > 0);
    
  const isLate = isFridayToday && !isTodayComplete && hasEntries;

  // Set Friday COB as 5pm on Friday
  const fridayCOB = new Date();
  fridayCOB.setDate(fridayCOB.getDate() + (5 - fridayCOB.getDay()));
  fridayCOB.setHours(17, 0, 0, 0);

  const currentTime = new Date();
  const timeUntilDeadline = fridayCOB.getTime() - currentTime.getTime();
  const daysUntil = Math.floor(timeUntilDeadline / (1000 * 60 * 60 * 24));
  const hoursUntil = Math.floor((timeUntilDeadline % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  let deadlineMessage = "";
  if (daysUntil > 0) {
    deadlineMessage = `${daysUntil} days and ${hoursUntil} hours remaining`;
  } else if (hoursUntil > 0) {
    deadlineMessage = `${hoursUntil} hours remaining`;
  } else {
    deadlineMessage = "Deadline passed";
  }

  const projectsChartData = Object.values(projectHours);
  const customersChartData = Object.values(customerHours);

  return {
    // Data
    timesheetEntries,
    projects,
    customers,
    dailyEntries,
    
    // Computed values
    totalHours,
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
  };
};
