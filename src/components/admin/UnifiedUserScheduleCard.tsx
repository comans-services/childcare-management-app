import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";
import { useWeeklyWorkSchedule } from "@/hooks/useWeeklyWorkSchedule";
import { Calendar, Save, RotateCcw, Settings, Target } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import WorkScheduleSelector from "@/components/timesheet/weekly-view/WorkScheduleSelector";
interface UnifiedUserScheduleCardProps {
  user: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
  };
  weekStartDate: Date;
}
const UnifiedUserScheduleCard: React.FC<UnifiedUserScheduleCardProps> = ({
  user,
  weekStartDate
}) => {
  const {
    workingDays,
    updateWorkingDays,
    loading: globalLoading,
    error: globalError
  } = useWorkSchedule(user.id);
  const {
    weeklySchedule,
    effectiveDailyHours,
    updateWeeklySchedule,
    loading: weeklyLoading,
    error: weeklyError,
    hasWeeklyOverride
  } = useWeeklyWorkSchedule(user.id, weekStartDate);
  const [editingWeekly, setEditingWeekly] = useState(false);
  const [weeklyFormData, setWeeklyFormData] = useState({
    monday_hours: 8,
    tuesday_hours: 8,
    wednesday_hours: 8,
    thursday_hours: 8,
    friday_hours: 8,
    saturday_hours: 0,
    sunday_hours: 0,
    notes: ""
  });
  React.useEffect(() => {
    if (effectiveDailyHours) {
      setWeeklyFormData({
        monday_hours: effectiveDailyHours.monday,
        tuesday_hours: effectiveDailyHours.tuesday,
        wednesday_hours: effectiveDailyHours.wednesday,
        thursday_hours: effectiveDailyHours.thursday,
        friday_hours: effectiveDailyHours.friday,
        saturday_hours: effectiveDailyHours.saturday,
        sunday_hours: effectiveDailyHours.sunday,
        notes: weeklySchedule?.notes || ""
      });
    }
  }, [effectiveDailyHours, weeklySchedule]);
  const handleGlobalWorkingDaysChange = async (days: number) => {
    console.log(`Admin updating global work schedule for ${user.email}: ${days} days`);
    await updateWorkingDays(days);
  };
  const handleWeeklySave = async () => {
    console.log(`Admin updating weekly work schedule for ${user.email}:`, weeklyFormData);
    await updateWeeklySchedule(weeklyFormData);
    setEditingWeekly(false);
  };
  const handleWeeklyReset = () => {
    setWeeklyFormData({
      monday_hours: effectiveDailyHours.monday,
      tuesday_hours: effectiveDailyHours.tuesday,
      wednesday_hours: effectiveDailyHours.wednesday,
      thursday_hours: effectiveDailyHours.thursday,
      friday_hours: effectiveDailyHours.friday,
      saturday_hours: effectiveDailyHours.saturday,
      sunday_hours: effectiveDailyHours.sunday,
      notes: weeklySchedule?.notes || ""
    });
    setEditingWeekly(false);
  };
  const weeklyTotal = Object.values(effectiveDailyHours).reduce((sum, hours) => sum + hours, 0);
  const globalWeeklyTarget = workingDays * 8;
  if (globalLoading || weeklyLoading) {
    return <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>;
  }
  if (globalError || weeklyError) {
    return <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {user.full_name || user.email}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">
            Failed to load work schedule data
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {user.full_name || user.email}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasWeeklyOverride && <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Custom
              </Badge>}
            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
              {user.role || "employee"}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Global Schedule Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Default Schedule</Label>
          </div>
          <WorkScheduleSelector workingDays={workingDays} onWorkingDaysChange={handleGlobalWorkingDaysChange} />
          
        </div>

        <Separator />

        {/* Weekly Override Section */}
        
      </CardContent>
    </Card>;
};

// Helper function to determine if a day should be working based on working days count
const getDefaultDayIndex = (day: string): number => {
  const dayMap: {
    [key: string]: number;
  } = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7
  };
  return dayMap[day] || 7;
};
export default UnifiedUserScheduleCard;