
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";
import { useWeeklyWorkSchedule } from "@/hooks/useWeeklyWorkSchedule";
import { useWeekendLock } from "@/hooks/useWeekendLock";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Clock, Target, Calendar as CalendarWeekend, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import DayCountSelector from "@/components/timesheet/weekly-view/DayCountSelector";
import WeeklyScheduleEditor from "./WeeklyScheduleEditor";
import { upsertWeeklyWorkSchedule, deleteWeeklyWorkSchedule, formatDaysSummary } from "@/lib/weekly-work-schedule-service";

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
    weeklySchedule,
    effectiveDays,
    effectiveHours,
    hasWeeklyOverride: hasOverride,
    loading: weeklyLoading,
    reload: reloadWeeklySchedule
  } = useWeeklyWorkSchedule(user.id, weekStartDate);

  const {
    canLogWeekendHours,
    allowWeekendEntries, // Use this for toggle state instead of canLogWeekendHours
    loading: weekendLoading,
    error: weekendError,
    updateWeekendPermission,
    refreshPermissions
  } = useWeekendLock(user.id);

  const handleWeekendToggle = async (enabled: boolean) => {
    if (!isAdmin) return;
    
    console.log(`Admin toggling weekend permission for user ${user.email} to: ${enabled}`);
    setUpdatingWeekend(true);
    
    try {
      const success = await updateWeekendPermission(enabled);
      if (!success) {
        console.error("Failed to update weekend permission");
      } else {
        console.log(`Successfully toggled weekend permission to: ${enabled}`);
      }
    } catch (error) {
      console.error("Error in handleWeekendToggle:", error);
    } finally {
      setUpdatingWeekend(false);
    }
  };

  const handleRefreshPermissions = () => {
    console.log(`Manually refreshing permissions for user ${user.email}`);
    refreshPermissions();
  };

  const handleSaveWeeklySchedule = async (scheduleData: any) => {
    await upsertWeeklyWorkSchedule(user.id, weekStartDate, scheduleData);
    await reloadWeeklySchedule();
  };

  const handleResetWeeklySchedule = async () => {
    await deleteWeeklyWorkSchedule(user.id, weekStartDate);
    await reloadWeeklySchedule();
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
          <div className="space-y-2">
            <div className="text-sm text-destructive">
              Failed to load work schedule data
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshPermissions}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
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
            {hasOverride && <Badge variant="secondary" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Custom Schedule
              </Badge>}
            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
              {user.role || "employee"}
            </Badge>
            {/* Admin override indicator */}
            {user.role === "admin" && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                Weekend Override
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {user.email}
          {hasOverride && weeklySchedule && (
            <span className="ml-2 text-xs text-primary">
              • {formatDaysSummary(weeklySchedule)}
            </span>
          )}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            {isAdmin && <TabsTrigger value="weekly">Weekly Hours</TabsTrigger>}
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            {/* This Week Schedule */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">This Week</span>
                {hasOverride && <div className="h-2 w-2 bg-primary rounded-full" />}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {effectiveDays} working days • {effectiveHours} hours total
              </div>
            </div>

            <Separator />

        {/* Enhanced Weekend Permissions Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarWeekend className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Weekend Entries</span>
              {/* Visual status indicator based on effective permission */}
              {canLogWeekendHours ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshPermissions}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {isAdmin ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Allow weekend hour logging
                </div>
                <Switch
                  checked={allowWeekendEntries} // Use raw permission, not effective permission
                  onCheckedChange={handleWeekendToggle}
                  disabled={updatingWeekend}
                />
              </div>
              
              {updatingWeekend && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                  Updating weekend permissions...
                </div>
              )}
              
              {/* Enhanced status display showing both raw and effective permissions */}
              <div className="space-y-1">
                <div className={`text-xs p-2 rounded border ${
                  allowWeekendEntries 
                    ? "text-green-700 bg-green-50 border-green-200" 
                    : "text-red-700 bg-red-50 border-red-200"
                }`}>
                  Permission Setting: Weekend entries {allowWeekendEntries ? "enabled" : "disabled"}
                </div>
                
                {user.role === "admin" && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                    Effective Permission: Can log weekend hours (admin override active)
                  </div>
                )}
                
                {user.role !== "admin" && (
                  <div className={`text-xs p-2 rounded border ${
                    canLogWeekendHours 
                      ? "text-green-700 bg-green-50 border-green-200" 
                      : "text-red-700 bg-red-50 border-red-200"
                  }`}>
                    Effective Permission: {canLogWeekendHours ? "Can log weekend hours" : "Cannot log weekend hours"}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className={`text-sm p-2 rounded border ${
                canLogWeekendHours 
                  ? "text-green-700 bg-green-50 border-green-200" 
                  : "text-red-700 bg-red-50 border-red-200"
              }`}>
                Weekend entries: {canLogWeekendHours ? "Enabled" : "Disabled"}
              </div>
            </div>
          )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>;
};

export default UnifiedUserScheduleCard;
