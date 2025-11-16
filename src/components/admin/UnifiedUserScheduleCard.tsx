
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";
import { useWeeklyWorkSchedule } from "@/hooks/useWeeklyWorkSchedule";
import { useWeekendLock } from "@/hooks/useWeekendLock";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Clock, Target, Calendar as CalendarWeekend, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
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
    hasWeeklyOverride: hasOverride,
    loading: weeklyLoading,
    updateWeeklySchedule
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
            {hasOverride && <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Custom
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
