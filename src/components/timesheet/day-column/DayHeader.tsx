
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatDateShort, isToday, isWeekend } from "@/lib/date-utils";
import { useWeekendLock } from "@/hooks/useWeekendLock";
import { useHolidayLock } from "@/hooks/useHolidayLock";
import { useAuth } from "@/context/AuthContext";

interface DayHeaderProps {
  date: Date;
}

const DayHeader: React.FC<DayHeaderProps> = ({ date }) => {
  const { user } = useAuth();
  const { validateWeekendEntry, canCreateWeekendEntries } = useWeekendLock(user?.id);
  const { validateHolidayEntry, canCreateHolidayEntries, checkIfHoliday, isAdmin } = useHolidayLock(user?.id);
  
  const [holidayInfo, setHolidayInfo] = useState<{ isHoliday: boolean; holidayName?: string }>({ isHoliday: false });
  
  // Check if date is a holiday
  useEffect(() => {
    const checkHoliday = async () => {
      const result = await checkIfHoliday(date);
      setHolidayInfo(result);
    };
    
    checkHoliday();
  }, [date, checkIfHoliday]);
  
  const isWeekendDay = isWeekend(date);
  const weekendValidation = validateWeekendEntry(date);
  const isWeekendBlocked = isWeekendDay && !weekendValidation.isValid;
  
  const isHolidayDate = holidayInfo.isHoliday;
  const isHolidayBlocked = isHolidayDate && !canCreateHolidayEntries && !isAdmin;

  // Determine header color based on status
  const getHeaderColor = () => {
    if (isToday(date)) {
      return "bg-primary text-primary-foreground";
    }
    
    if (isHolidayBlocked) {
      return "bg-red-100 text-red-800";
    }
    
    if (isHolidayDate && (canCreateHolidayEntries || isAdmin)) {
      return "bg-purple-100 text-purple-800";
    }
    
    if (isWeekendBlocked) {
      return "bg-red-100 text-red-800";
    }
    
    if (isWeekendDay) {
      return "bg-blue-100 text-blue-800";
    }
    
    return "bg-muted";
  };

  return (
    <div className={cn(
      "text-xs md:text-sm font-medium p-2 md:p-3 rounded-t-md relative overflow-hidden",
      getHeaderColor()
    )}>
      <div className="flex justify-between items-center">
        <span className="font-bold">{formatDateShort(date)}</span>
        <div className="flex items-center gap-1">
          {isToday(date) && (
            <span className="px-1.5 py-0.5 bg-white/20 text-white rounded-full text-[10px]">Today</span>
          )}
          
          {isHolidayDate && (
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px]",
              isHolidayBlocked 
                ? "bg-red-200 text-red-800" 
                : canCreateHolidayEntries || isAdmin
                ? "bg-purple-200 text-purple-800"
                : "bg-gray-200 text-gray-800"
            )} title={holidayInfo.holidayName}>
              {isHolidayBlocked 
                ? "Holiday - Blocked" 
                : canCreateHolidayEntries || isAdmin
                ? "Holiday - Allowed"
                : "Holiday"}
            </span>
          )}
          
          {isWeekendDay && !isHolidayDate && (
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
