import { useState, useRef, useEffect } from "react";
import { startOfMonth, addMonths, subMonths, isSameDay } from "date-fns";
import { DateRange, getCurrentISOWeek, isValidDateRange } from "@/lib/date-range-utils";
import { DateRangePickerState } from "../types";

export const useDateRangePicker = (value: DateRange, onChange: (range: DateRange) => void) => {
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

  const handleApply = (close: () => void) => {
    if (isValidDateRange(tempRange)) {
      onChange(tempRange);
      close();
    }
  };

  const handleCancel = (close: () => void) => {
    setTempRange(value);
    setSelectedPreset(null);
    close();
  };

  // New improved date click handler that properly handles deselection
  const handleDateClick = (date: Date) => {
    setSelectedPreset(null); // Clear preset when manually selecting dates
    
    const isClickingFromDate = tempRange.from && isSameDay(date, tempRange.from);
    const isClickingToDate = tempRange.to && isSameDay(date, tempRange.to);
    const isSameDateRange = tempRange.from && tempRange.to && isSameDay(tempRange.from, tempRange.to);
    
    // Case 1: Clicking on a date when both from and to are the same (single date selected)
    if (isSameDateRange && (isClickingFromDate || isClickingToDate)) {
      // Clear both dates to deselect the single date
      setTempRange({ from: new Date(), to: new Date() });
      return;
    }
    
    // Case 2: Clicking on the from date (when it's different from to date)
    if (isClickingFromDate && tempRange.to && !isSameDay(tempRange.from, tempRange.to)) {
      // Move the to date to from, effectively removing the from date
      setTempRange({ from: tempRange.to, to: tempRange.to });
      return;
    }
    
    // Case 3: Clicking on the to date (when it's different from from date)
    if (isClickingToDate && tempRange.from && !isSameDay(tempRange.from, tempRange.to)) {
      // Keep only the from date, remove the to date
      setTempRange({ from: tempRange.from, to: tempRange.from });
      return;
    }
    
    // Case 4: Normal date selection logic
    if (!tempRange.from || (tempRange.from && tempRange.to)) {
      // Start a new selection
      setTempRange({ from: date, to: date });
    } else if (tempRange.from && !tempRange.to) {
      // Complete the range
      if (date >= tempRange.from) {
        setTempRange({ from: tempRange.from, to: date });
      } else {
        setTempRange({ from: date, to: tempRange.from });
      }
    }
  };

  // Wrapper for calendar onSelect that uses our custom logic
  const handleCalendarSelect = (range: any) => {
    // We'll handle selection through handleDateClick instead
    // This prevents the default calendar behavior from interfering
    return;
  };

  const handleKeyDown = (event: React.KeyboardEvent, close: () => void) => {
    if (event.key === 'Escape') {
      handleCancel(close);
    } else if (event.key === 'Enter' && isValidDateRange(tempRange)) {
      handleApply(close);
    }
  };

  const handlePreviousMonth = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const nextMonth = addMonths(currentMonth, 1);

  return {
    tempRange,
    selectedPreset,
    currentMonth,
    nextMonth,
    closeTimeoutRef,
    handlePresetClick,
    handleApply,
    handleCancel,
    handleDateClick,
    handleCalendarSelect,
    handleKeyDown,
    handlePreviousMonth,
    handleNextMonth,
  };
};
