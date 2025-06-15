
import React, { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import { getWeekStart, isWeekend } from "@/lib/date-utils";
import { useSimpleWeeklySchedule } from "@/hooks/useSimpleWeeklySchedule";
import { useWeekendLock } from "@/hooks/useWeekendLock";
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
  viewAsUserId?: string | null;
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
  viewAsUserId,
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Determine the effective user ID for schedule and weekend permissions
  const effectiveUserId = viewAsUserId || user?.id;

  // Get weekend permissions for the effective user
  const { canLogWeekendHours } = useWeekendLock(effectiveUserId);

  // Get current week's schedule using the effective user ID
  const weekStartDate = getWeekStart(currentDate);
  const {
    effectiveDays: workingDays,
    effectiveHours: weeklyTarget,
  } = useSimpleWeeklySchedule(effectiveUserId || "", weekStartDate);

  // Determine which dates to display in the grid with weekend filtering
  const displayDates = useMemo(() => {
    if (viewMode === "today") {
      return [currentDate];
    }
    
    // In week mode, filter out weekends if user doesn't have permission
    if (!canLogWeekendHours) {
      return weekDates.filter(date => !isWeekend(date));
    }
    
    return weekDates;
  }, [viewMode, currentDate, weekDates, canLogWeekendHours]);

  // Filter entries based on the view mode and displayed dates
  const filteredEntries = useMemo(() => {
    const displayDateStrings = displayDates.map(date => date.toISOString().substring(0, 10));
    
    return entries.filter(entry => {
      const entryDateString = String(entry.entry_date).substring(0, 10);
      return displayDateStrings.includes(entryDateString);
    });
  }, [entries, displayDates]);

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

  // Calculate the target based on view mode and visible days
  const workingDaysTarget = useMemo(() => {
    if (viewMode === "today") return 1;
    return displayDates.length; // Use actual visible days count
  }, [viewMode, displayDates.length]);

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
          <div className={`grid gap-2 ${viewMode === "today" ? "grid-cols-1" : `grid-cols-1 md:grid-cols-${Math.min(displayDates.length, 7)}`}`}>
            {Array.from({ length: displayDates.length }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        }
        priority={true}
        className="w-full max-w-full overflow-hidden"
      >
        {isMobile ? (
          <MobileWeekGrid
            weekDates={displayDates}
            userId={effectiveUserId || ""}
            entries={entries}
            projects={projects}
            onEntryChange={onEntryChange}
            onAddEntry={onAddEntry}
            onEditEntry={onEditEntry}
            viewMode={viewMode}
          />
        ) : (
          <WeekGrid
            weekDates={displayDates}
            userId={effectiveUserId || ""}
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

      {/* Weekend Hidden Indicator */}
      {viewMode === "week" && !canLogWeekendHours && (
        <div className="text-center text-sm text-muted-foreground mt-2">
          Weekend columns are hidden. Contact your administrator to enable weekend entries.
        </div>
      )}
    </>
  );
};

export default WeeklyViewContent;
