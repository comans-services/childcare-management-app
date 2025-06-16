
import React from "react";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import WeekNavigation from "./WeekNavigation";
import WeeklyHoursSummary from "./WeeklyHoursSummary";
import WorkScheduleSelector from "./WorkScheduleSelector";
import WeekGrid from "./WeekGrid";
import MobileWeekGrid from "./MobileWeekGrid";
import { useIsMobile } from "@/hooks/use-mobile";

interface WeeklyViewContentProps {
  entries: TimesheetEntry[];
  projects: Project[];
  selectedDate: Date;
  weekStartDate: Date;
  workingDays: number;
  targetUserId: string;
  canPerformOperations: boolean;
  onDateSelect: (date: Date) => void;
  onEditEntry: (entry: TimesheetEntry) => void;
  onDeleteEntry: (entry: TimesheetEntry) => void;
  onDialogOpen: (open: boolean) => void;
  onWorkingDaysChange: (days: number) => void;
  onNavigateWeek: (direction: "prev" | "next") => void;
}

const WeeklyViewContent: React.FC<WeeklyViewContentProps> = ({
  entries,
  projects,
  selectedDate,
  weekStartDate,
  workingDays,
  targetUserId,
  canPerformOperations,
  onDateSelect,
  onEditEntry,
  onDeleteEntry,
  onDialogOpen,
  onWorkingDaysChange,
  onNavigateWeek,
}) => {
  const isMobile = useIsMobile();

  return (
    <>
      {/* Week Navigation */}
      <WeekNavigation
        weekStartDate={weekStartDate}
        onNavigateWeek={onNavigateWeek}
      />

      {/* Weekly Hours Summary */}
      <WeeklyHoursSummary
        entries={entries}
        weekStartDate={weekStartDate}
        workingDays={workingDays}
        targetUserId={targetUserId}
      />

      {/* Work Schedule Selector */}
      <WorkScheduleSelector
        targetUserId={targetUserId}
        workingDays={workingDays}
        onWorkingDaysChange={onWorkingDaysChange}
      />

      {/* Week Grid */}
      {isMobile ? (
        <MobileWeekGrid
          entries={entries}
          projects={projects}
          selectedDate={selectedDate}
          weekStartDate={weekStartDate}
          workingDays={workingDays}
          targetUserId={targetUserId}
          canPerformOperations={canPerformOperations}
          onDateSelect={onDateSelect}
          onEditEntry={onEditEntry}
          onDeleteEntry={onDeleteEntry}
          onDialogOpen={onDialogOpen}
        />
      ) : (
        <WeekGrid
          entries={entries}
          projects={projects}
          selectedDate={selectedDate}
          weekStartDate={weekStartDate}
          workingDays={workingDays}
          targetUserId={targetUserId}
          canPerformOperations={canPerformOperations}
          onDateSelect={onDateSelect}
          onEditEntry={onEditEntry}
          onDeleteEntry={onDeleteEntry}
          onDialogOpen={onDialogOpen}
        />
      )}
    </>
  );
};

export default WeeklyViewContent;
