
import React from "react";
import { Lock } from "lucide-react";
import { isWeekend } from "@/lib/date-utils";
import { useAuth } from "@/context/AuthContext";

interface WeekendLockIndicatorProps {
  date: Date;
  className?: string;
}

const WeekendLockIndicator: React.FC<WeekendLockIndicatorProps> = ({ 
  date, 
  className = "" 
}) => {
  const { userRole } = useAuth();
  
  // Don't show lock for admins or non-weekend days
  if (userRole === 'admin' || !isWeekend(date)) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center text-amber-600 ${className}`}>
      <Lock className="h-4 w-4" />
    </div>
  );
};

export default WeekendLockIndicator;
