
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWorkSchedule } from "@/hooks/useWorkSchedule";
import { useWeeklyWorkSchedule } from "@/hooks/useWeeklyWorkSchedule";
import { useWeekendLock } from "@/hooks/useWeekendLock";
import { useEmploymentType } from "@/hooks/useEmploymentType";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Clock, Target, Calendar as CalendarWeekend, CheckCircle, XCircle, RefreshCw, Info, Briefcase, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import DayCountSelector from "@/components/timesheet/weekly-view/DayCountSelector";
import WeeklyScheduleEditor from "./WeeklyScheduleEditor";
import TemplateScheduleEditor from "./TemplateScheduleEditor";
import { upsertWeeklyWorkSchedule, deleteWeeklyWorkSchedule, formatDaysSummary } from "@/lib/weekly-work-schedule-service";
import { upsertWorkScheduleTemplate } from "@/lib/work-schedule-service";
import { toast } from "@/hooks/use-toast";

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
  const { employmentType } = useEmploymentType();
  const [updatingWeekend, setUpdatingWeekend] = useState(false);
  
  const isFullTime = employmentType === 'full-time';

  const {
    workingDays,
    templateSchedule,
    loading: globalLoading,
    error: globalError,
    reload: reloadGlobalSchedule
  } = useWorkSchedule(user.id);

  const {
    weeklySchedule,
    effectiveDays,
    effectiveHours,
    hasWeeklyOverride: hasOverride,
    hasTemplate,
    scheduleSource,
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

  const handleSaveTemplate = async (templateHours: any) => {
    try {
      await upsertWorkScheduleTemplate(user.id, templateHours);
      await reloadGlobalSchedule();
      await reloadWeeklySchedule();
      toast({
        title: "Template Saved",
        description: "Default schedule template has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearTemplate = async () => {
    try {
      await upsertWorkScheduleTemplate(user.id, {
        monday_hours: 0,
        tuesday_hours: 0,
        wednesday_hours: 0,
        thursday_hours: 0,
        friday_hours: 0,
        saturday_hours: 0,
        sunday_hours: 0,
      });
      await reloadGlobalSchedule();
      await reloadWeeklySchedule();
      toast({
        title: "Template Cleared",
        description: "Default schedule template has been cleared.",
      });
    } catch (error) {
      console.error("Error clearing template:", error);
      toast({
        title: "Error",
        description: "Failed to clear template. Please try again.",
        variant: "destructive",
      });
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
            {/* Employment Type Badge */}
            <Badge 
              variant={isFullTime ? "default" : "secondary"} 
              className="text-xs"
            >
              <Briefcase className="h-3 w-3 mr-1" />
              {employmentType === 'full-time' ? 'Full-Time' : employmentType === 'part-time' ? 'Part-Time' : 'Casual'}
            </Badge>
            
            {hasOverride && <Badge variant="secondary" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Custom Schedule
              </Badge>}
            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
              {user.role || "employee"}
            </Badge>
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
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-2'}`}>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          {isAdmin && <TabsTrigger value="template">Default Template</TabsTrigger>}
          {isAdmin && <TabsTrigger value="weekly">Weekly Hours</TabsTrigger>}
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4 mt-4">
          {/* Schedule Source Indicator */}
          <div className="flex gap-2">
            {scheduleSource === 'override' && (
              <Badge variant="default" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Weekly Override
              </Badge>
            )}
            {scheduleSource === 'template' && (
              <Badge variant="secondary" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Using Template
              </Badge>
            )}
            {scheduleSource === 'default' && (
              <Badge variant="outline" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                Default Schedule
              </Badge>
            )}
          </div>

          {/* Employment Type Notice */}
          {isFullTime && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Full-time employees are automatically scheduled Mon-Fri (5 days, 40 hours/week). Use Weekly Hours tab to override specific weeks.
              </AlertDescription>
            </Alert>
          )}
          
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

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Global Working Days</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {workingDays} days per week {isFullTime && '(Mon-Fri for full-time)'}
            </div>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="template" className="space-y-4 mt-4">
            <TemplateScheduleEditor
              userId={user.id}
              currentTemplate={templateSchedule}
              onSave={handleSaveTemplate}
              onClear={handleClearTemplate}
            />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="weekly" className="space-y-4 mt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Set specific hours for each day of this week. This will override the template and global settings.
              </p>
              <WeeklyScheduleEditor
                userId={user.id}
                weekStartDate={weekStartDate}
                weeklySchedule={weeklySchedule}
                defaultHours={workingDays * 8 / 5}
                onSave={handleSaveWeeklySchedule}
                onReset={handleResetWeeklySchedule}
              />
            </div>
          </TabsContent>
        )}

        <TabsContent value="permissions" className="space-y-4 mt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarWeekend className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Weekend Entries</span>
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
                    checked={allowWeekendEntries}
                    onCheckedChange={handleWeekendToggle}
                    disabled={updatingWeekend}
                  />
                </div>
                
                {updatingWeekend && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                    Updating weekend permissions...
                  </div>
                )}
                
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
                      Effective Permission: {canLogWeekendHours ? "Can" : "Cannot"} log weekend hours
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {canLogWeekendHours ? "You can log weekend hours" : "Weekend logging is disabled"}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      </CardContent>
    </Card>;
};

export default UnifiedUserScheduleCard;
