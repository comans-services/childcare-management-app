import React from "react";
import { format, isSameDay, isToday, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { Plus } from "lucide-react";

export interface DayData {
  date: Date;
  totalHours: number;
  hasEntries: boolean;
}

export interface ScheduledDailyHours {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface WeekStripProps {
  weekDates: Date[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  dailyTotals?: Map<string, number>;
  scheduledDailyHours?: ScheduledDailyHours;
  onAddEntry?: (date: Date) => void;
}

export function WeekStrip({
  weekDates,
  selectedDate,
  onDateSelect,
  dailyTotals = new Map(),
  scheduledDailyHours,
  onAddEntry,
}: WeekStripProps) {
  const handleDateClick = (date: Date) => {
    haptics.light();
    onDateSelect(date);
  };

  const handleAddEntry = (date: Date, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent date selection
    haptics.medium();
    onAddEntry?.(date);
  };

  // Helper to get scheduled hours for a specific date
  const getScheduledHours = (date: Date): number => {
    if (!scheduledDailyHours) return 8; // Default to 8 if no schedule provided

    const dayIndex = getDay(date); // 0 = Sunday, 1 = Monday, etc.
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    return scheduledDailyHours[dayMap[dayIndex]];
  };

  return (
    <div className="bg-white border-b">
      <div className="flex overflow-x-auto gap-2 p-3 scrollbar-hide">
        {weekDates
          .filter((date) => {
            // Only show Monday-Friday (weekdays), hide Saturday-Sunday
            const dayIndex = getDay(date); // 0=Sunday, 1=Monday, ..., 6=Saturday
            return dayIndex >= 1 && dayIndex <= 5; // Monday(1) to Friday(5)
          })
          .map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentDay = isToday(date);
          const dayKey = format(date, 'yyyy-MM-dd');
          const totalHours = dailyTotals.get(dayKey) || 0;
          const hasEntries = totalHours > 0;
          const scheduledHours = getScheduledHours(date);
          const isScheduled = scheduledHours > 0;

          return (
            <div key={dayKey} className="flex-shrink-0 flex flex-col gap-1">
              {/* Day card */}
              <button
                onClick={() => handleDateClick(date)}
                className={cn(
                  "flex flex-col items-center justify-center",
                  "min-w-[72px] rounded-lg px-3 py-2",
                  "transition-all duration-200",
                  "active:scale-95",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : isCurrentDay
                    ? "bg-primary/10 text-primary border-2 border-primary"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                )}
              >
                <span className={cn(
                  "text-xs font-medium uppercase",
                  isSelected && "text-primary-foreground"
                )}>
                  {format(date, 'EEE')}
                </span>
                <span className={cn(
                  "text-2xl font-bold",
                  isSelected && "text-primary-foreground"
                )}>
                  {format(date, 'd')}
                </span>
                {hasEntries && (
                  <span className={cn(
                    "text-xs font-medium mt-1",
                    isSelected
                      ? "text-primary-foreground"
                      : "text-primary"
                  )}>
                    {totalHours.toFixed(1)}h
                  </span>
                )}
                {!hasEntries && (
                  <span className={cn(
                    "text-xs mt-1",
                    isSelected
                      ? "text-primary-foreground/60"
                      : "text-gray-400"
                  )}>
                    —
                  </span>
                )}
              </button>

              {/* Add button */}
              {onAddEntry && (
                <button
                  onClick={(e) => handleAddEntry(date, e)}
                  disabled={!isScheduled}
                  className={cn(
                    "flex items-center justify-center gap-1",
                    "min-w-[72px] min-h-[32px] rounded-md px-2 py-1",
                    "text-xs font-medium",
                    "transition-all duration-200",
                    isScheduled
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                  )}
                  title={isScheduled ? `Add time (${scheduledHours}h scheduled)` : "Not scheduled"}
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
