
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getCurrentWeekDates,
  getNextWeek,
  getPreviousWeek,
  formatDateDisplay,
} from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  fetchUserProjects,
  fetchTimesheetEntries,
  Project,
  TimesheetEntry,
} from "@/lib/timesheet-service";
import DayColumn from "./DayColumn";
import { toast } from "@/hooks/use-toast";

const WeeklyView: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const dates = getCurrentWeekDates(currentDate);
    setWeekDates(dates);
  }, [currentDate]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch projects and entries in parallel
      const [projectsData, entriesData] = await Promise.all([
        fetchUserProjects(),
        fetchTimesheetEntries(
          user.id,
          weekDates[0],
          weekDates[weekDates.length - 1]
        ),
      ]);

      setProjects(projectsData);
      setEntries(entriesData);
    } catch (error) {
      console.error("Error fetching timesheet data:", error);
      toast({
        title: "Error",
        description: "Failed to load timesheet data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weekDates.length > 0 && user) {
      fetchData();
    }
  }, [weekDates, user]);

  const navigateToPreviousWeek = () => {
    setCurrentDate(getPreviousWeek(currentDate));
  };

  const navigateToNextWeek = () => {
    setCurrentDate(getNextWeek(currentDate));
  };

  const navigateToCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={navigateToPreviousWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToCurrentWeek}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={navigateToNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="font-medium">
          {weekDates.length > 0 && (
            <>
              {formatDateDisplay(weekDates[0])} - {formatDateDisplay(weekDates[weekDates.length - 1])}
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="text-center">
            <div className="text-lg">Loading timesheet data...</div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {weekDates.map((date) => (
              <DayColumn
                key={date.toISOString()}
                date={date}
                userId={user?.id || ""}
                entries={entries}
                projects={projects}
                onEntryChange={fetchData}
              />
            ))}
          </div>
        </div>
      )}

      <div className="text-right text-sm text-muted-foreground">
        Total Week Hours:{" "}
        {entries.reduce((sum, entry) => sum + entry.hours_logged, 0).toFixed(2)}
      </div>
    </div>
  );
};

export default WeeklyView;
