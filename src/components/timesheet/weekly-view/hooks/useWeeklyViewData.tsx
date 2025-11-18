
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTimesheetEntries,
  TimesheetEntry,
} from "@/lib/timesheet-service";
import { toast } from "@/hooks/use-toast";

export const useWeeklyViewData = (weekDates: Date[], viewAsUserId?: string | null) => {
  const { user, session } = useAuth();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Determine which user ID to use for data fetching
  const targetUserId = viewAsUserId || user?.id;

  // Clear all state when user changes
  const clearComponentState = useCallback(() => {
    console.log("=== CLEARING WEEKLY VIEW DATA STATE ===");
    setEntries([]);
    setError(null);
  }, []);

  const fetchData = useCallback(async () => {
    if (!user?.id || !session) {
      console.log("No authenticated user or session found, skipping data fetch");
      setError("Authentication required");
      setLoading(false);
      return;
    }

    console.log("=== WEEKLY VIEW DATA FETCH ===");
    console.log(`Session user: ${session.user?.id} (${session.user?.email})`);
    console.log(`Context user: ${user.id}`);
    console.log(`Target user (viewAs): ${targetUserId}`);

    setLoading(true);
    setError(null);
    
    try {
      console.log("Starting data fetch for target user:", targetUserId);
      
      // Fetch entries if we have valid dates - pass target user ID for admin viewing
      if (weekDates.length > 0) {
        console.log("Fetching entries for date range:", weekDates[0], "to", weekDates[weekDates.length - 1]);
        console.log("Fetching entries for user:", targetUserId);
        
        const entriesData = await fetchTimesheetEntries(
          weekDates[0],
          weekDates[weekDates.length - 1],
          { includeUserData: true, forceUserId: targetUserId }
        );
        
        console.log("Successfully fetched entries:", entriesData.length);
        setEntries(entriesData);
      }
    } catch (error) {
      console.error("Error fetching timesheet data:", error);
      setError(`Failed to load timesheet data: ${error.message || 'Unknown error'}`);
      
      // Show user-friendly error message
      toast({
        title: "Error loading data",
        description: "There was a problem loading the timesheet data. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [weekDates, user?.id, session, targetUserId, viewAsUserId]);

  return {
    entries,
    loading,
    error,
    fetchData,
    clearComponentState,
  };
};
