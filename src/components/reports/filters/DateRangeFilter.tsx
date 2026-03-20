
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportFiltersType } from "@/pages/ReportsPage";
import { fetchPayPeriods, type PayPeriod } from "@/lib/payroll/payroll-service";

interface DateRangeFilterProps {
  filters: ReportFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<ReportFiltersType>>;
}

export const DateRangeFilter = ({ filters, setFilters }: DateRangeFilterProps) => {
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("custom");

  useEffect(() => {
    const loadPeriods = async () => {
      try {
        const periods = await fetchPayPeriods(24);
        setPayPeriods(periods);
      } catch (error) {
        console.error("Failed to load pay periods:", error);
      }
    };
    loadPeriods();
  }, []);

  const handlePeriodSelect = (periodId: string) => {
    setSelectedPeriodId(periodId);
    if (periodId === "custom") return;

    const period = payPeriods.find((p) => p.id === periodId);
    if (period) {
      setFilters((prev) => ({
        ...prev,
        startDate: parseISO(period.period_start),
        endDate: parseISO(period.period_end),
      }));
    }
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedPeriodId("custom");
    setFilters((prev) => {
      const newFilters = { ...prev, startDate: date };
      if (prev.endDate && date > prev.endDate) {
        newFilters.endDate = date;
      }
      return newFilters;
    });
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedPeriodId("custom");
    setFilters((prev) => {
      const newFilters = { ...prev, endDate: date };
      if (prev.startDate && date < prev.startDate) {
        newFilters.startDate = date;
      }
      return newFilters;
    });
  };

  const formatPeriodLabel = (period: PayPeriod) => {
    const start = parseISO(period.period_start);
    const end = parseISO(period.period_end);
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-medium">Date Range</label>
      <div className="flex flex-wrap gap-2 items-center">
        {/* Pay Period Quick Select */}
        <Select value={selectedPeriodId} onValueChange={handlePeriodSelect}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select pay period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom Range</SelectItem>
            {payPeriods.map((period) => (
              <SelectItem key={period.id} value={period.id}>
                {formatPeriodLabel(period)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Start Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !filters.startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.startDate ? format(filters.startDate, "PPP") : <span>Start date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.startDate}
              onSelect={handleStartDateSelect}
              disabled={(date) => (filters.endDate ? date > filters.endDate : false)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <span>to</span>

        {/* End Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !filters.endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.endDate ? format(filters.endDate, "PPP") : <span>End date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.endDate}
              onSelect={handleEndDateSelect}
              disabled={(date) => (filters.startDate ? date < filters.startDate : false)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
