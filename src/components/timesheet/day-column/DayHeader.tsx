
import React from "react";
import { format } from "date-fns";
import { isToday, isWeekend } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import WeekendLockIndicator from "../WeekendLockIndicator";

interface DayHeaderProps {
  date: Date;
}

const DayHeader: React.FC<DayHeaderProps> = ({ date }) => {
  const isCurrentDay = isToday(date);
  const isWeekendDay = isWeekend(date);

  return (
    <div className={cn(
      "p-3 border-b bg-background text-center rounded-t-md relative",
      isCurrentDay && "bg-primary/10 border-primary/30",
      isWeekendDay && "bg-gray-50"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className={cn(
            "text-sm font-medium",
            isCurrentDay && "text-primary font-semibold"
          )}>
            {format(date, "EEE")}
          </div>
          <div className={cn(
            "text-lg font-bold",
            isCurrentDay && "text-primary"
          )}>
            {format(date, "d")}
          </div>
        </div>
        <WeekendLockIndicator date={date} />
      </div>
    </div>
  );
};

export default DayHeader;
