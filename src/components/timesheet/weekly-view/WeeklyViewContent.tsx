
import React, { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import { getWeekStart } from "@/lib/date-utils";
import { useSimpleWeeklySchedule } from "@/hooks/useSimpleWeeklySchedule";
import { useIsMobile } from "@/hooks/use-mobile";
import { LazyContent } from "@/components/common/LazyContent";
import WeeklyProgressBar from "./WeeklyProgressBar";
import WeeklyHoursSummary from "./WeeklyHoursSummary";
import MobileWeeklyHoursSummary from "./MobileWeeklyHoursSummary";
import WeekGrid from "./WeekGrid";
import MobileWeekGrid from "./MobileWeekGrid";
import EmptyState from "./EmptyState";

interface WeeklyViewContentProps {
  weekDates: Date[];
  currentDate: Date;
  viewMode: "today" | "week";
  entries: TimesheetEntry[];
  projects: Project[];
  onEntryChange: () => void;
  onAddEntry: (date: Date, entry?: TimesheetEntry) => void;
  onEditEntry: (date: Date, entry?: TimesheetEntry) => void;
  onDragEnd: (result: any) => void;
}

const WeeklyViewContent: React.FC<WeeklyViewContentProps> = ({
  weekDates,
  currentDate,
  viewMode,
  entries,
  projects,
  onEntryChange,
  onAddEntry,
  onEditEntry,
  onDragEnd,
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Get current week's schedule using the unified hook
  const weekStartDate = getWeekStart(currentDate);
  const {
    effectiveDays: workingDays,
    effectiveHours: weeklyTarget,
  } = useSimpleWeeklySchedule(user?.id || "", weekStartDate);

  // Filter entries based on the view mode
  const filteredEntries = useMemo(() => {
    return viewMode === "today" 
      ? entries.filter(entry => {
          const entryDateString = String(entry.entry_date).substring(0, 10);
          const currentDateString = currentDate.toISOString().substring(0, 10);
          return entryDateString === currentDateString;
        })
      : entries;
  }, [entries, viewMode, currentDate]);

  // Calculate total hours for the current view
  const totalHours = useMemo(() => {
    return filteredEntries.reduce((sum, entry) => {
      const hoursLogged = Number(entry.hours_logged) || 0;
      return sum + hoursLogged;
    }, 0);
  }, [filteredEntries]);

  // Calculate unique days worked
  const totalDaysWorked = useMemo(() => {
    const uniqueDatesWorked = new Set(
      filteredEntries.map(entry => {
        const entryDateString = String(entry.entry_date);
        return entryDateString.substring(0, 10);
      })
    );
    return uniqueDatesWorked.size;
  }, [filteredEntries]);

  // Calculate the target based on view mode
  const workingDaysTarget = viewMode === "today" ? 1 : workingDays;

  if (!user?.id) {
    return <div className="text-center text-gray-500">Please sign in to view your timesheet.</div>;
  }

  if (projects.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {/* Hours Summary */}
      {filteredEntries.length > 0 && (
        <LazyContent
          fallback={<div className="h-20 bg-gray-100 rounded-lg animate-pulse" />}
          priority={true}
        >
          {isMobile ? (
            <MobileWeeklyHoursSummary 
              totalHours={totalHours}
              weeklyTarget={weeklyTarget}
              entries={entries}
            />
          ) : (
            <WeeklyHoursSummary 
              totalHours={totalHours}
              weeklyTarget={weeklyTarget}
              entries={entries}
            />
          )}
        </LazyContent>
      )}

      {/* Week/Day Grid */}
      <LazyContent
        fallback={
          <div className="grid gap-2 grid-cols-1 md:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        }
        priority={true}
        className="w-full max-w-full overflow-hidden"
      >
        {isMobile ? (
          <MobileWeekGrid
            weekDates={weekDates}
            userId={user.id}
            entries={entries}
            projects={projects}
            onEntryChange={onEntryChange}
            onAddEntry={onAddEntry}
            onEditEntry={onEditEntry}
            viewMode={viewMode}
          />
        ) : (
          <WeekGrid
            weekDates={weekDates}
            userId={user.id}
            entries={entries}
            projects={projects}
            onEntryChange={onEntryChange}
            onDragEnd={onDragEnd}
            onAddEntry={onAddEntry}
            onEditEntry={onEditEntry}
            viewMode={viewMode}
          />
        )}
      </LazyContent>

      {/* Progress Bar */}
      {filteredEntries.length > 0 && (
        <LazyContent
          fallback={<div className="h-4 bg-gray-100 rounded animate-pulse" />}
          priority={true}
        >
          <WeeklyProgressBar 
            totalDaysWorked={totalDaysWorked} 
            workingDaysTarget={workingDaysTarget} 
          />
        </LazyContent>
      )}
    </>
  );
};

export default WeeklyViewContent;
