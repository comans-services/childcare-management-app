
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";
import { useSimpleWeeklySchedule } from "@/hooks/useSimpleWeeklySchedule";
import { useWeekendLock } from "@/hooks/useWeekendLock";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Clock, Target, Calendar as CalendarWeekend } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import DayCountSelector from "@/components/timesheet/weekly-view/DayCountSelector";

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
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const [updatingWeekend, setUpdatingWeekend] = useState(false);

  const {
    workingDays,
    loading: globalLoading,
    error: globalError
  } = useWorkSchedule(user.id);

  const {
    effectiveDays,
    effectiveHours,
    hasOverride,
    isLoading: weeklyLoading,
    updateWeeklyDays,
    revertToDefault,
    isUpdating,
    isReverting
  } = useSimpleWeeklySchedule(user.id, weekStartDate);

  const {
    canLogWeekendHours,
    loading: weekendLoading,
    error: weekendError
  } = useWeekendLock(user.id);

  const handleWeekendToggle = async (enabled: boolean) => {
    if (!isAdmin) return;
    
    setUpdatingWeekend(true);
    try {
      const { error } = await supabase
        .from("work_schedules")
        .upsert({
          user_id: user.id,
          allow_weekend_entries: enabled,
          working_days: workingDays,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("Error updating weekend permissions:", error);
        toast({
          title: "Error",
          description: "Failed to update weekend permissions. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Weekend Permissions Updated",
        description: `Weekend entries ${enabled ? 'enabled' : 'disabled'} for ${user.full_name || user.email}.`,
      });
    } catch (error) {
      console.error("Error updating weekend permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update weekend permissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingWeekend(false);
    }
  };

  if (globalLoading || weeklyLoading || weekendLoading) {
    return <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>;
  }

  if (globalError || weekendError) {
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
            {hasOverride && <Badge variant="outline" className="text-xs">
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
        {/* This Week Schedule - Only show controls to admins */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">This Week</span>
            {hasOverride && <div className="h-2 w-2 bg-blue-500 rounded-full" />}
          </div>
          
          {isAdmin ? <DayCountSelector currentDays={effectiveDays} hasOverride={hasOverride} onDaysChange={updateWeeklyDays} onRevertToDefault={revertToDefault} isUpdating={isUpdating} isReverting={isReverting} /> : <div className="text-sm text-muted-foreground">
              {effectiveDays} working days this week
            </div>}
        </div>

        <Separator />

        {/* Weekend Permissions - Only show controls to admins */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarWeekend className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Weekend Entries</span>
          </div>
          
          {isAdmin ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Allow weekend hour logging
              </div>
              <Switch
                checked={canLogWeekendHours}
                onCheckedChange={handleWeekendToggle}
                disabled={updatingWeekend}
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Weekend entries: {canLogWeekendHours ? "Enabled" : "Disabled"}
            </div>
          )}
        </div>

        <Separator />

        {/* Default Schedule Reference */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Default Schedule</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {workingDays} days per week
          </div>
        </div>
      </CardContent>
    </Card>;
};

export default UnifiedUserScheduleCard;
