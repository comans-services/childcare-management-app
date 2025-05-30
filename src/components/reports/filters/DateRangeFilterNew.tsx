
import React from "react";
import { DateRangePicker, DateRange } from "@/components/ui/DateRangePicker";
import { ReportFiltersType } from "@/pages/ReportsPage";

interface DateRangeFilterNewProps {
  filters: ReportFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<ReportFiltersType>>;
}

export const DateRangeFilterNew = ({ filters, setFilters }: DateRangeFilterNewProps) => {
  const handleDateRangeChange = (range: DateRange) => {
    setFilters(prev => ({
      ...prev,
      startDate: range.from || new Date(new Date().setDate(1)), // Default to first day of current month
      endDate: range.to || new Date() // Default to today
    }));
  };

  const dateRangeValue: DateRange = {
    from: filters.startDate,
    to: filters.endDate
  };

  return (
    <div className="flex flex-col gap-2 w-full md:w-auto">
      <label className="text-sm font-medium">Date Range</label>
      <DateRangePicker
        value={dateRangeValue}
        onChange={handleDateRangeChange}
        className="w-full md:w-[300px]"
      />
    </div>
  );
};
