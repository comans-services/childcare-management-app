
import React from "react";
import { Progress } from "@/components/ui/progress";

interface WeeklyProgressBarProps {
  totalWeekHours: number;
  weeklyTarget: number;
}

const WeeklyProgressBar: React.FC<WeeklyProgressBarProps> = ({ 
  totalWeekHours, 
  weeklyTarget 
}) => {
  const weekProgress = Math.min((totalWeekHours / weeklyTarget) * 100, 100);
  
  const getProgressColor = () => {
    if (weekProgress < 30) return "bg-amber-500";
    if (weekProgress < 70) return "bg-blue-500";
    if (weekProgress < 100) return "bg-emerald-500";
    return "bg-violet-500"; // Over 100%
  };

  return (
    <div className="mt-4 space-y-2 animate-in fade-in-50 duration-300">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          Weekly Progress: {totalWeekHours.toFixed(2)}/{weeklyTarget} hours
        </span>
        <span className="text-sm font-medium">{weekProgress.toFixed(0)}%</span>
      </div>
      <Progress 
        value={weekProgress} 
        className="h-2" 
        indicatorClassName={getProgressColor()} 
      />
    </div>
  );
};

export default WeeklyProgressBar;
