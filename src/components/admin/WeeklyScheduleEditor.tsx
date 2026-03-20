import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Save, RotateCcw, Loader2 } from "lucide-react";
import { WeeklyWorkSchedule, calculateWeeklyTotal } from "@/lib/weekly-work-schedule-service";

interface WeeklyScheduleEditorProps {
  userId: string;
  weekStartDate: Date;
  weeklySchedule: WeeklyWorkSchedule | null;
  defaultHours?: number;
  onSave: (scheduleData: Partial<WeeklyWorkSchedule>) => Promise<void>;
  onReset: () => Promise<void>;
}

const DEFAULT_DAY_HOURS = 8;

const WeeklyScheduleEditor: React.FC<WeeklyScheduleEditorProps> = ({
  weekStartDate,
  weeklySchedule,
  onSave,
  onReset,
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [workingDays, setWorkingDays] = useState<Record<string, boolean>>({
    monday_hours: false,
    tuesday_hours: false,
    wednesday_hours: false,
    thursday_hours: false,
    friday_hours: false,
    saturday_hours: false,
    sunday_hours: false,
  });

  useEffect(() => {
    if (weeklySchedule) {
      setWorkingDays({
        monday_hours: Number(weeklySchedule.monday_hours || 0) > 0,
        tuesday_hours: Number(weeklySchedule.tuesday_hours || 0) > 0,
        wednesday_hours: Number(weeklySchedule.wednesday_hours || 0) > 0,
        thursday_hours: Number(weeklySchedule.thursday_hours || 0) > 0,
        friday_hours: Number(weeklySchedule.friday_hours || 0) > 0,
        saturday_hours: Number(weeklySchedule.saturday_hours || 0) > 0,
        sunday_hours: Number(weeklySchedule.sunday_hours || 0) > 0,
      });
    }
  }, [weeklySchedule]);

  const handleDayToggle = (key: string, checked: boolean) => {
    setWorkingDays(prev => ({ ...prev, [key]: checked }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const scheduleData = {
        monday_hours: workingDays.monday_hours ? DEFAULT_DAY_HOURS : 0,
        tuesday_hours: workingDays.tuesday_hours ? DEFAULT_DAY_HOURS : 0,
        wednesday_hours: workingDays.wednesday_hours ? DEFAULT_DAY_HOURS : 0,
        thursday_hours: workingDays.thursday_hours ? DEFAULT_DAY_HOURS : 0,
        friday_hours: workingDays.friday_hours ? DEFAULT_DAY_HOURS : 0,
        saturday_hours: workingDays.saturday_hours ? DEFAULT_DAY_HOURS : 0,
        sunday_hours: workingDays.sunday_hours ? DEFAULT_DAY_HOURS : 0,
      };
      await onSave(scheduleData);
      toast({
        title: "Schedule Saved",
        description: "Weekly schedule updated successfully",
      });
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Error",
        description: "Failed to save weekly schedule",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await onReset();
      setWorkingDays({
        monday_hours: false,
        tuesday_hours: false,
        wednesday_hours: false,
        thursday_hours: false,
        friday_hours: false,
        saturday_hours: false,
        sunday_hours: false,
      });
      toast({
        title: "Schedule Reset",
        description: "Reverted to default schedule",
      });
    } catch (error) {
      console.error("Error resetting schedule:", error);
      toast({
        title: "Error",
        description: "Failed to reset schedule",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const dayLabels = [
    { key: 'monday_hours' as const, label: 'Monday' },
    { key: 'tuesday_hours' as const, label: 'Tuesday' },
    { key: 'wednesday_hours' as const, label: 'Wednesday' },
    { key: 'thursday_hours' as const, label: 'Thursday' },
    { key: 'friday_hours' as const, label: 'Friday' },
    { key: 'saturday_hours' as const, label: 'Saturday' },
    { key: 'sunday_hours' as const, label: 'Sunday' },
  ];

  const activeDays = Object.values(workingDays).filter(Boolean).length;
  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Week of {weekStartDate.toLocaleDateString()} – {weekEnd.toLocaleDateString()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {dayLabels.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Checkbox
                id={`weekly-${key}`}
                checked={workingDays[key] ?? false}
                onCheckedChange={(checked) => handleDayToggle(key, !!checked)}
              />
              <Label
                htmlFor={`weekly-${key}`}
                className="w-24 text-sm cursor-pointer select-none"
              >
                {label}
              </Label>
              {workingDays[key] && (
                <div className="h-2 w-2 bg-primary rounded-full" />
              )}
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Working days this week:</span>
            <span className="font-bold text-primary">{activeDays} day{activeDays !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving || resetting}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={saving || resetting || !weeklySchedule}
            className="flex-1"
          >
            {resetting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Default
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyScheduleEditor;
