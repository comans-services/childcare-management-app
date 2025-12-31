import React from "react";
import { format, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

export interface DayData {
  date: Date;
  totalHours: number;
  hasEntries: boolean;
}

export interface WeekStripProps {
  weekDates: Date[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  dailyTotals?: Map<string, number>;
}

export function WeekStrip({
  weekDates,
  selectedDate,
  onDateSelect,
  dailyTotals = new Map(),
}: WeekStripProps) {
  const handleDateClick = (date: Date) => {
    haptics.light();
    onDateSelect(date);
  };

  return (
    <div className="bg-white border-b">
      <div className="flex overflow-x-auto gap-2 p-3 scrollbar-hide">
        {weekDates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentDay = isToday(date);
          const dayKey = format(date, 'yyyy-MM-dd');
          const totalHours = dailyTotals.get(dayKey) || 0;
          const hasEntries = totalHours > 0;

          return (
            <button
              key={dayKey}
              onClick={() => handleDateClick(date)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center justify-center",
                "min-w-touch min-h-touch",
                "rounded-lg px-3 py-2",
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
          );
        })}
      </div>
    </div>
  );
}
