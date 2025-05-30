
import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { DateRange, isFutureDate } from "@/lib/date-range-utils";

interface DualCalendarProps {
  tempRange: DateRange;
  currentMonth: Date;
  nextMonth: Date;
  onDateClick: (date: Date) => void;
  onCalendarSelect: (range: any) => void;
  onPreviousMonth: (event: React.MouseEvent) => void;
  onNextMonth: (event: React.MouseEvent) => void;
}

export const DualCalendar = ({ 
  tempRange, 
  currentMonth, 
  nextMonth, 
  onDateClick,
  onCalendarSelect,
  onPreviousMonth, 
  onNextMonth 
}: DualCalendarProps) => {
  // Custom Day component that handles our click logic
  const CustomDay = ({ date, displayMonth }: { date: Date; displayMonth: Date }) => {
    const isSelected = (tempRange.from && date.getTime() === tempRange.from.getTime()) || 
                     (tempRange.to && date.getTime() === tempRange.to.getTime());
    const isInRange = tempRange.from && tempRange.to && 
                     date >= tempRange.from && date <= tempRange.to;
    const isDisabled = isFutureDate(date);
    const isOutsideMonth = date.getMonth() !== displayMonth.getMonth();

    return (
      <button
        type="button"
        onClick={() => !isDisabled && onDateClick(date)}
        disabled={isDisabled}
        className={`
          h-9 w-9 p-0 font-normal rounded-md text-sm transition-colors
          ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : ''}
          ${isInRange && !isSelected ? 'bg-accent text-accent-foreground' : ''}
          ${!isSelected && !isInRange ? 'hover:bg-accent hover:text-accent-foreground' : ''}
          ${isDisabled ? 'text-muted-foreground opacity-50 cursor-not-allowed' : ''}
          ${isOutsideMonth ? 'text-muted-foreground opacity-50' : ''}
          ${date.toDateString() === new Date().toDateString() && !isSelected ? 'bg-accent text-accent-foreground' : ''}
        `}
      >
        {date.getDate()}
      </button>
    );
  };

  // Custom components to hide Calendar navigation and override day rendering
  const customComponents = {
    IconLeft: () => null,
    IconRight: () => null,
    Caption: ({ displayMonth }: { displayMonth: Date }) => null,
    Day: CustomDay,
  };

  return (
    <div className="p-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-8 text-sm font-medium">
          <span>{format(currentMonth, "MMMM yyyy")}</span>
          <span>{format(nextMonth, "MMMM yyyy")}</span>
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Dual Calendars */}
      <div className="flex gap-4">
        {/* Current Month Calendar */}
        <Calendar
          mode="range"
          selected={{
            from: tempRange.from,
            to: tempRange.to,
          }}
          onSelect={onCalendarSelect}
          month={currentMonth}
          disabled={isFutureDate}
          weekStartsOn={1}
          className="p-0"
          components={customComponents}
        />

        {/* Next Month Calendar */}
        <Calendar
          mode="range"
          selected={{
            from: tempRange.from,
            to: tempRange.to,
          }}
          onSelect={onCalendarSelect}
          month={nextMonth}
          disabled={isFutureDate}
          weekStartsOn={1}
          className="p-0"
          components={customComponents}
        />
      </div>
    </div>
  );
};
