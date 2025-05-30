
import React from "react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { ReportFiltersType } from "@/pages/ReportsPage";

interface DateRangeFilterProps {
  filters: ReportFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<ReportFiltersType>>;
}

export const DateRangeFilterNew = ({ filters, setFilters }: DateRangeFilterProps) => {
  const handleRangeChange = (range: { from: Date; to: Date }) => {
    setFilters(prev => ({
      ...prev,
      startDate: range.from,
      endDate: range.to
    }));
  };

  return (
    <div className="flex flex-col gap-2 w-full md:w-auto">
      <label className="text-sm font-medium">Date Range</label>
      <DateRangePicker
        value={{
          from: filters.startDate,
          to: filters.endDate
        }}
        onChange={handleRangeChange}
        className="w-full md:w-auto"
      />
    </div>
  );
};
