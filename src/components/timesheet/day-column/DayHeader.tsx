
import React from "react";
import { cn } from "@/lib/utils";
import { formatDateShort, isToday, isWeekend } from "@/lib/date-utils";
import { Lock } from "lucide-react";
import { useWeekendLock } from "@/hooks/useWeekendLock";

interface DayHeaderProps {
  date: Date;
}

const DayHeader: React.FC<DayHeaderProps> = ({ date }) => {
  const { isWeekendLocked, isLoading } = useWeekendLock();
  const isLocked = !isLoading && isWeekendLocked(date);
  const isWeekendDay = isWeekend(date);

  return (
    <div className={cn(
      "text-xs md:text-sm font-medium p-2 md:p-3 rounded-t-md relative overflow-hidden",
      isToday(date) 
        ? "bg-primary text-primary-foreground" 
        : isWeekendDay
        ? "bg-gray-100 border border-gray-300"
        : "bg-muted"
    )}>
      <div className="flex justify-between items-center">
        <span className="font-bold">{formatDateShort(date)}</span>
        <div className="flex items-center gap-1">
          {isToday(date) && (
            <span className="px-1.5 py-0.5 bg-white/20 text-white rounded-full text-[10px]">Today</span>
          )}
          {isLocked && (
            <Lock className="h-3 w-3 text-gray-500" />
          )}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1">
        <div className="progress-indicator h-full w-0"></div>
      </div>
    </div>
  );
};

export default DayHeader;
