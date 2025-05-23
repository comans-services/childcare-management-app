
import React from "react";
import { cn } from "@/lib/utils";
import { formatDateShort, isToday } from "@/lib/date-utils";

interface DayHeaderProps {
  date: Date;
}

const DayHeader: React.FC<DayHeaderProps> = ({ date }) => {
  return (
    <div className={cn(
      "text-xs md:text-sm font-medium p-2 md:p-3 rounded-t-md relative overflow-hidden",
      isToday(date) 
        ? "bg-primary text-primary-foreground" 
        : "bg-muted"
    )}>
      <div className="flex justify-between items-center">
        <span className="font-bold">{formatDateShort(date)}</span>
        {isToday(date) && (
          <span className="px-1.5 py-0.5 bg-white/20 text-white rounded-full text-[10px]">Today</span>
        )}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1">
        <div className="progress-indicator h-full w-0"></div>
      </div>
    </div>
  );
};

export default DayHeader;
