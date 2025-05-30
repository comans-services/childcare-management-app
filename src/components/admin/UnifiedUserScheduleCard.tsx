
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";
import { useWeeklyWorkSchedule } from "@/hooks/useWeeklyWorkSchedule";
import { Calendar, Save, RotateCcw, Info, Target, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatDateDisplay } from "@/lib/date-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UnifiedUserScheduleCardProps {
  user: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
  };
  weekStartDate: Date;
}

const UnifiedUserScheduleCard: React.FC<UnifiedUserScheduleCardProps> = ({ user, weekStartDate }) => {
  const { workingDays, loading: globalLoading, error: globalError } = useWorkSchedule(user.id);
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
    notes: "",
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
        notes: weeklySchedule?.notes || "",
      });
    }
  }, [effectiveDailyHours, weeklySchedule]);

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
      notes: weeklySchedule?.notes || "",
    });
    setEditingWeekly(false);
  };

  const weeklyTotal = Object.values(effectiveDailyHours).reduce((sum, hours) => sum + hours, 0);
  const globalWeeklyTarget = workingDays * 8;

  // Helper function to determine if a day should be working based on working days count
  const getDefaultDayIndex = (day: string): number => {
    const dayMap: { [key: string]: number } = {
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

  const getWeekEndDate = () => {
    const endDate = new Date(weekStartDate);
    endDate.setDate(endDate.getDate() + 6);
    return endDate;
  };

  if (globalLoading || weeklyLoading) {
    return (
      <Card className="hover:shadow-md transition-shadow">
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
      </Card>
    );
  }

  if (globalError || weeklyError) {
    return (
      <Card className="hover:shadow-md transition-shadow">
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
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {user.full_name || user.email}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasWeeklyOverride && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Custom
              </Badge>
            )}
            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
              {user.role || "employee"}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Week Schedule Section - Primary Interface */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">
                Week of {formatDateDisplay(weekStartDate)} - {formatDateDisplay(getWeekEndDate())}
              </Label>
            </div>
            <div className="text-xs text-muted-foreground">
              Total: {weeklyTotal}h
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Changes here only affect this specific week. Default schedule shown below for reference.
            </AlertDescription>
          </Alert>

          {editingWeekly ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(weeklyFormData).filter(([key]) => key.endsWith('_hours')).map(([key, value]) => (
                  <div key={key}>
                    <Label htmlFor={key} className="capitalize text-xs">
                      {key.replace('_hours', '')}
                    </Label>
                    <Input
                      id={key}
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={value}
                      onChange={(e) => setWeeklyFormData(prev => ({
                        ...prev,
                        [key]: parseFloat(e.target.value) || 0
                      }))}
                      className="h-7 text-xs"
                    />
                  </div>
                ))}
              </div>
              <div>
                <Label htmlFor="notes" className="text-xs">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Week-specific notes..."
                  value={weeklyFormData.notes}
                  onChange={(e) => setWeeklyFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleWeeklySave} size="sm" className="flex-1 text-xs">
                  <Save className="h-3 w-3 mr-1" />
                  Save Week Schedule
                </Button>
                <Button onClick={handleWeeklyReset} variant="outline" size="sm" className="flex-1 text-xs">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(effectiveDailyHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="capitalize font-medium">{day}:</span>
                    <span className={hours !== (workingDays >= getDefaultDayIndex(day) ? 8 : 0) ? "text-primary font-medium" : ""}>
                      {hours}h
                    </span>
                  </div>
                ))}
              </div>
              <Button onClick={() => setEditingWeekly(true)} className="w-full text-xs" size="sm">
                {hasWeeklyOverride ? "Edit This Week" : "Customize This Week"}
              </Button>
              {weeklySchedule?.notes && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="mt-1 p-2 bg-muted rounded text-xs">{weeklySchedule.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Default Schedule Reference - Read Only */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium text-muted-foreground">Default Schedule (Reference)</Label>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Working Days: {workingDays} days/week</div>
            <div>Weekly Target: {globalWeeklyTarget} hours</div>
            <div className="text-xs opacity-75">
              This shows the user's default schedule pattern. Week-specific changes above override this.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedUserScheduleCard;
