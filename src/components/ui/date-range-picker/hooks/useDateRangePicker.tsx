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

  // Improved date click handler that supports both range selection and deselection
  const handleDateClick = (date: Date) => {
    setSelectedPreset(null); // Clear preset when manually selecting dates
    
    const isClickingFromDate = tempRange.from && isSameDay(date, tempRange.from);
    const isClickingToDate = tempRange.to && isSameDay(date, tempRange.to);
    const hasBothDates = tempRange.from && tempRange.to;
    const isSingleDateSelected = hasBothDates && isSameDay(tempRange.from, tempRange.to);
    const isCompleteDateRange = hasBothDates && !isSameDay(tempRange.from, tempRange.to);
    
    // DESELECTION LOGIC: Only deselect if clicking on an already selected date
    if (isClickingFromDate || isClickingToDate) {
      // If it's a single date selection, clear everything
      if (isSingleDateSelected) {
        setTempRange({ from: new Date(), to: new Date() });
        return;
      }
      
      // If it's a complete range, handle specific date deselection
      if (isCompleteDateRange) {
        if (isClickingFromDate && !isClickingToDate) {
          // Remove from date, keep to date as new single selection
          setTempRange({ from: tempRange.to, to: tempRange.to });
          return;
        }
        if (isClickingToDate && !isClickingFromDate) {
          // Remove to date, keep from date as new single selection
          setTempRange({ from: tempRange.from, to: tempRange.from });
          return;
        }
      }
    }
    
    // NORMAL RANGE SELECTION LOGIC
    
    // Case 1: No dates selected OR complete range exists - start new selection
    if (!tempRange.from || !tempRange.to || isCompleteDateRange) {
      setTempRange({ from: date, to: date });
      return;
    }
    
    // Case 2: Single date selected - complete the range
    if (tempRange.from && tempRange.to && isSingleDateSelected) {
      if (date >= tempRange.from) {
        // Clicked date is after/same as from date
        setTempRange({ from: tempRange.from, to: date });
      } else {
        // Clicked date is before from date
        setTempRange({ from: date, to: tempRange.from });
      }
      return;
    }
    
    // Case 3: Fallback - start new selection
    setTempRange({ from: date, to: date });
  };

  // Wrapper for calendar onSelect that prevents default behavior
  const handleCalendarSelect = (range: any) => {
    // We handle all selection through handleDateClick instead
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
