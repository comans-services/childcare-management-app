import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchProjectsWithTotalHours, fetchTimesheetEntries, Project, TimesheetEntry } from "@/lib/timesheet-service";
import { toast } from "@/hooks/use-toast";

export const useDashboardData = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [projectsData, entriesData] = await Promise.all([
        fetchProjectsWithTotalHours(),
        fetchTimesheetEntries({ userId: user.id })
      ]);

      setProjects(projectsData);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = () => {
    fetchData();
  };

  return {
    projects,
    entries,
    isLoading,
    refreshData
  };
};
