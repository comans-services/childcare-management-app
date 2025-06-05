
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface WeeklyHoursSummaryProps {
  totalHours: number;
  weeklyTarget?: number;
}

const WeeklyHoursSummary: React.FC<WeeklyHoursSummaryProps> = ({ 
  totalHours, 
  weeklyTarget 
}) => {
  const formatHours = (hours: number) => {
    return hours.toFixed(1);
  };

  const getHoursColor = () => {
    if (!weeklyTarget) return "text-blue-600";
    
    const percentage = (totalHours / weeklyTarget) * 100;
    if (percentage < 50) return "text-amber-600";
    if (percentage < 100) return "text-blue-600";
    return "text-green-600";
  };

  return (
    <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hours This Week</p>
              <p className={`text-2xl font-bold ${getHoursColor()}`}>
                {formatHours(totalHours)} hours
              </p>
            </div>
          </div>
          {weeklyTarget && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Weekly Target</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatHours(weeklyTarget)} hours
              </p>
              <p className="text-xs text-gray-500">
                {((totalHours / weeklyTarget) * 100).toFixed(0)}% complete
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyHoursSummary;
