
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWorkingDaysValidation } from "@/hooks/useWorkingDaysValidation";
import { TimesheetEntry } from "@/lib/timesheet-service";
import { getWeekStart } from "@/lib/date-utils";

interface WeeklyHoursSummaryProps {
  totalHours: number;
  weeklyTarget?: number;
  entries?: TimesheetEntry[];
}

const WeeklyHoursSummary: React.FC<WeeklyHoursSummaryProps> = ({
  totalHours,
  weeklyTarget,
  entries = []
}) => {
  const { user } = useAuth();
  
  // Get working days validation for current week
  const currentWeekStart = getWeekStart(new Date());
  const validation = useWorkingDaysValidation(user?.id || "", entries, currentWeekStart);

  const formatHours = (hours: number) => {
    return hours.toFixed(1);
  };

  const getHoursColor = () => {
    if (!weeklyTarget) return "text-blue-600";
    const percentage = totalHours / weeklyTarget * 100;
    if (percentage < 50) return "text-amber-600";
    if (percentage < 100) return "text-blue-600";
    return "text-green-600";
  };

  const getDaysColor = () => {
    const percentage = validation.daysWorked / validation.daysAllowed * 100;
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
          
          {/* Working Days Summary */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Days Worked</p>
              <p className={`text-xl font-bold ${getDaysColor()}`}>
                {validation.daysWorked} / {validation.daysAllowed} days
              </p>
              {validation.daysRemaining > 0 && (
                <p className="text-xs text-muted-foreground">
                  {validation.daysRemaining} days remaining
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyHoursSummary;
