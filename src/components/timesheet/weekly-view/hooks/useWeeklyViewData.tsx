
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchUserProjects,
  fetchTimesheetEntries,
  Project,
  AnyTimeEntry,
} from "@/lib/timesheet-service";
import { toast } from "@/hooks/use-toast";

export const useWeeklyViewData = (weekDates: Date[]) => {
  const { user, session } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<AnyTimeEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear all state when user changes
  const clearComponentState = useCallback(() => {
    console.log("=== CLEARING WEEKLY VIEW DATA STATE ===");
    setProjects([]);
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

    setLoading(true);
    setError(null);
    
    try {
      console.log("Starting data fetch for authenticated user:", user.id);
      
      // Fetch projects first
      const projectsData = await fetchUserProjects();
      console.log("Successfully fetched projects:", projectsData.length);
      
      setProjects(projectsData);
      
      // Then fetch entries if we have valid dates - RLS will automatically filter by user
      if (weekDates.length > 0) {
        console.log("Fetching entries for date range:", weekDates[0], "to", weekDates[weekDates.length - 1]);
        
        const entriesData = await fetchTimesheetEntries(
          weekDates[0],
          weekDates[weekDates.length - 1],
          { includeUserData: true, forceUserId: user.id }
        );
        
        console.log("Successfully fetched entries via RLS:", entriesData.length);
        setEntries(entriesData);
      }
    } catch (error) {
      console.error("Error fetching timesheet data:", error);
      setError(`Failed to load timesheet data: ${error.message || 'Unknown error'}`);
      
      // Show user-friendly error message
      toast({
        title: "Error loading data",
        description: "There was a problem loading your timesheet. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [weekDates, user?.id, session]);

  return {
    projects,
    entries,
    loading,
    error,
    fetchData,
    clearComponentState,
  };
};
