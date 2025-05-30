
import { useState, useRef, useEffect } from "react";
import { startOfMonth, addMonths, subMonths } from "date-fns";
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
    handleDateSelect,
    handleKeyDown,
    handlePreviousMonth,
    handleNextMonth,
  };
};
