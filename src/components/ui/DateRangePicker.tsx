
import React, { useState, useRef, useEffect } from "react";
import { Popover } from "@headlessui/react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  DateRange, 
  dateRangePresets, 
  formatDateRangeDisplay, 
  isFutureDate,
  isValidDateRange,
  getCurrentISOWeek,
  getNextMonth
} from "@/lib/date-range-utils";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
  className?: string;
}

export const DateRangePicker = ({ 
  value, 
  onChange, 
  disabled = false,
  className 
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(value);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const closeTimeoutRef = useRef<NodeJS.Timeout>();

  // Update temp range when value changes externally
  useEffect(() => {
    setTempRange(value);
  }, [value]);

  // Initialize with "This week" preset on first load
  useEffect(() => {
    const thisWeekRange = getCurrentISOWeek();
    if (!value.from || !value.to) {
      onChange(thisWeekRange);
      setSelectedPreset("this_week");
    }
  }, []);

  const handlePresetClick = (preset: any) => {
    const range = preset.range();
    setTempRange(range);
    setSelectedPreset(preset.value);
  };

  const handleApply = () => {
    if (isValidDateRange(tempRange)) {
      onChange(tempRange);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setTempRange(value);
    setSelectedPreset(null);
    setIsOpen(false);
  };

  const handleDateSelect = (date: Date | undefined, type: 'from' | 'to') => {
    if (!date) return;
    
    setSelectedPreset(null); // Clear preset when manually selecting dates
    
    if (type === 'from') {
      const newRange = { ...tempRange, from: date };
      // If start date is after end date, adjust end date
      if (tempRange.to && date > tempRange.to) {
        newRange.to = date;
      }
      setTempRange(newRange);
    } else {
      const newRange = { ...tempRange, to: date };
      // If end date is before start date, adjust start date
      if (tempRange.from && date < tempRange.from) {
        newRange.from = date;
      }
      setTempRange(newRange);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleCancel();
    } else if (event.key === 'Enter' && isValidDateRange(tempRange)) {
      handleApply();
    }
  };

  const nextMonth = addMonths(currentMonth, 1);

  return (
    <div className={cn("relative", className)}>
      <Popover>
        {({ open }) => (
          <>
            <Popover.Button
              disabled={disabled}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                disabled && "opacity-50 cursor-not-allowed",
                open && "ring-2 ring-blue-500 border-blue-500"
              )}
              onKeyDown={handleKeyDown}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-gray-900">
                  {formatDateRangeDisplay(value)}
                </span>
              </div>
            </Popover.Button>

            <Popover.Panel className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="flex" onKeyDown={handleKeyDown}>
                {/* Left Sidebar with Presets */}
                <div className="w-48 p-4 border-r border-gray-200">
                  <div className="space-y-1">
                    {dateRangePresets.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => handlePresetClick(preset)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                          selectedPreset === preset.value
                            ? "bg-blue-100 text-blue-900"
                            : "hover:bg-gray-100 text-gray-700"
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Footer Buttons */}
                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                    <Button
                      onClick={handleApply}
                      className="w-full"
                      size="sm"
                      disabled={!isValidDateRange(tempRange)}
                    >
                      Apply
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>

                {/* Right Side - Dual Calendar */}
                <div className="p-4">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex gap-8 text-sm font-medium">
                      <span>{format(currentMonth, "MMMM yyyy")}</span>
                      <span>{format(nextMonth, "MMMM yyyy")}</span>
                    </div>
                    <button
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="p-1 hover:bg-gray-100 rounded"
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
                      onSelect={(range) => {
                        if (range?.from) {
                          handleDateSelect(range.from, 'from');
                        }
                        if (range?.to) {
                          handleDateSelect(range.to, 'to');
                        }
                      }}
                      month={currentMonth}
                      disabled={isFutureDate}
                      weekStartsOn={1}
                      className="p-0"
                    />

                    {/* Next Month Calendar */}
                    <Calendar
                      mode="range"
                      selected={{
                        from: tempRange.from,
                        to: tempRange.to,
                      }}
                      onSelect={(range) => {
                        if (range?.from) {
                          handleDateSelect(range.from, 'from');
                        }
                        if (range?.to) {
                          handleDateSelect(range.to, 'to');
                        }
                      }}
                      month={nextMonth}
                      disabled={isFutureDate}
                      weekStartsOn={1}
                      className="p-0"
                    />
                  </div>
                </div>
              </div>
            </Popover.Panel>
          </>
        )}
      </Popover>
    </div>
  );
};

