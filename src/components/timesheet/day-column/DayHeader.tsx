
import React from "react";
import { cn } from "@/lib/utils";
import { formatDateShort, isToday, isWeekend } from "@/lib/date-utils";
import { useWeekendLock } from "@/hooks/useWeekendLock";
import { useAuth } from "@/context/AuthContext";

interface DayHeaderProps {
  date: Date;
}

const DayHeader: React.FC<DayHeaderProps> = ({ date }) => {
  const { user } = useAuth();
  const { validateWeekendEntry, canCreateWeekendEntries } = useWeekendLock(user?.id);
  
  const isWeekendDay = isWeekend(date);
  const weekendValidation = validateWeekendEntry(date);
  const isWeekendBlocked = isWeekendDay && !weekendValidation.isValid;

  return (
    <div className={cn(
      "text-xs md:text-sm font-medium p-2 md:p-3 rounded-t-md relative overflow-hidden",
      isToday(date) 
        ? "bg-primary text-primary-foreground" 
        : isWeekendBlocked
        ? "bg-red-100 text-red-800"
        : isWeekendDay
        ? "bg-blue-100 text-blue-800"
        : "bg-muted"
    )}>
      <div className="flex justify-between items-center">
        <span className="font-bold">{formatDateShort(date)}</span>
        <div className="flex items-center gap-1">
          {isToday(date) && (
            <span className="px-1.5 py-0.5 bg-white/20 text-white rounded-full text-[10px]">Today</span>
          )}
          {isWeekendDay && (
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px]",
              isWeekendBlocked 
                ? "bg-red-200 text-red-800" 
                : canCreateWeekendEntries
                ? "bg-green-200 text-green-800"
                : "bg-blue-200 text-blue-800"
            )}>
              {isWeekendBlocked 
                ? "Blocked" 
                : canCreateWeekendEntries 
                ? "Weekend" 
                : "Weekend"}
            </span>
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
