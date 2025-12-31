import React from "react";
import { Clock, Target, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export interface QuickStatsProps {
  totalHours: number;
  expectedHours: number;
  daysWorked: number;
  expectedDays: number;
}

export function QuickStats({
  totalHours,
  expectedHours,
  daysWorked,
  expectedDays,
}: QuickStatsProps) {
  const hoursPercentage = expectedHours > 0 ? (totalHours / expectedHours) * 100 : 0;
  const isOnTrack = hoursPercentage >= 90 && hoursPercentage <= 110;
  const isOvertime = hoursPercentage > 110;
  const isUndertime = hoursPercentage < 90;

  return (
    <Card className="m-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="grid grid-cols-2 gap-4">
        {/* Total Hours */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-600 font-medium">Total Hours</p>
            <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
            <p className="text-xs text-gray-500">of {expectedHours}h</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            isOnTrack && "bg-green-100",
            isOvertime && "bg-orange-100",
            isUndertime && "bg-blue-100"
          )}>
            {isOnTrack && <Target className="w-5 h-5 text-green-600" />}
            {isOvertime && <TrendingUp className="w-5 h-5 text-orange-600" />}
            {isUndertime && <AlertCircle className="w-5 h-5 text-blue-600" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-600 font-medium">Progress</p>
            <p className={cn(
              "text-2xl font-bold",
              isOnTrack && "text-green-600",
              isOvertime && "text-orange-600",
              isUndertime && "text-blue-600"
            )}>
              {hoursPercentage.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500">
              {daysWorked}/{expectedDays} days
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              isOnTrack && "bg-green-500",
              isOvertime && "bg-orange-500",
              isUndertime && "bg-blue-500"
            )}
            style={{ width: `${Math.min(hoursPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-3">
        {isOnTrack && (
          <p className="text-xs text-green-700 font-medium">
            On track for this week
          </p>
        )}
        {isOvertime && (
          <p className="text-xs text-orange-700 font-medium">
            {(totalHours - expectedHours).toFixed(1)}h overtime
          </p>
        )}
        {isUndertime && (
          <p className="text-xs text-blue-700 font-medium">
            {(expectedHours - totalHours).toFixed(1)}h remaining
          </p>
        )}
      </div>
    </Card>
  );
}
