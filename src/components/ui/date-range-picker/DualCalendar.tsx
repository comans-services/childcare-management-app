
import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { DateRange, isFutureDate } from "@/lib/date-range-utils";
import { cn } from "@/lib/utils";

interface DualCalendarProps {
  tempRange: DateRange;
  currentMonth: Date;
  nextMonth: Date;
  onDateSelect: (date: Date | undefined, type: 'from' | 'to') => void;
  onPreviousMonth: (event: React.MouseEvent) => void;
  onNextMonth: (event: React.MouseEvent) => void;
  isMobile?: boolean;
}

export const DualCalendar = ({ 
  tempRange, 
  currentMonth, 
  nextMonth, 
  onDateSelect, 
  onPreviousMonth, 
  onNextMonth,
  isMobile = false
}: DualCalendarProps) => {
  // Custom components to hide Calendar navigation
  const customComponents = {
    IconLeft: () => null,
    IconRight: () => null,
    Caption: ({ displayMonth }: { displayMonth: Date }) => null,
  };

  return (
    <div className={cn(
      isMobile ? "p-4" : "p-4",
      "min-h-0"
    )}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onPreviousMonth}
          className={cn(
            "p-2 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
            isMobile && "p-3"
          )}
          aria-label="Previous month"
        >
          <ChevronLeft className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
        </button>
        <div className={cn(
          "text-sm font-medium",
          isMobile ? "flex flex-col items-center gap-1" : "flex gap-8"
        )}>
          <span className={cn(isMobile && "text-xs")}>{format(currentMonth, "MMMM yyyy")}</span>
          {!isMobile && <span>{format(nextMonth, "MMMM yyyy")}</span>}
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          className={cn(
            "p-2 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
            isMobile && "p-3"
          )}
          aria-label="Next month"
        >
          <ChevronRight className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
        </button>
      </div>

      {/* Calendar(s) */}
      <div className={cn(
        isMobile ? "flex justify-center" : "flex gap-4"
      )}>
        {/* Current Month Calendar */}
        <Calendar
          mode="range"
          selected={{
            from: tempRange.from,
            to: tempRange.to,
          }}
          onSelect={(range) => {
            if (range?.from) {
              onDateSelect(range.from, 'from');
            }
            if (range?.to) {
              onDateSelect(range.to, 'to');
            }
          }}
          month={currentMonth}
          disabled={isFutureDate}
          weekStartsOn={1}
          className="p-0 pointer-events-auto"
          components={customComponents}
        />

        {/* Next Month Calendar - Hidden on Mobile */}
        {!isMobile && (
          <Calendar
            mode="range"
            selected={{
              from: tempRange.from,
              to: tempRange.to,
            }}
            onSelect={(range) => {
              if (range?.from) {
                onDateSelect(range.from, 'from');
              }
              if (range?.to) {
                onDateSelect(range.to, 'to');
              }
            }}
            month={nextMonth}
            disabled={isFutureDate}
            weekStartsOn={1}
            className="p-0 pointer-events-auto"
            components={customComponents}
          />
        )}
      </div>
    </div>
  );
};
