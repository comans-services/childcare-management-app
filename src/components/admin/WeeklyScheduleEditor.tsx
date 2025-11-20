import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const WeeklyScheduleEditor: React.FC<WeeklyScheduleEditorProps> = ({
  weekStartDate,
  weeklySchedule,
  defaultHours = 8,
  onSave,
  onReset,
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  const [hours, setHours] = useState({
    monday_hours: 0,
    tuesday_hours: 0,
    wednesday_hours: 0,
    thursday_hours: 0,
    friday_hours: 0,
    saturday_hours: 0,
    sunday_hours: 0,
  });

  useEffect(() => {
    if (weeklySchedule) {
      setHours({
        monday_hours: Number(weeklySchedule.monday_hours || 0),
        tuesday_hours: Number(weeklySchedule.tuesday_hours || 0),
        wednesday_hours: Number(weeklySchedule.wednesday_hours || 0),
        thursday_hours: Number(weeklySchedule.thursday_hours || 0),
        friday_hours: Number(weeklySchedule.friday_hours || 0),
        saturday_hours: Number(weeklySchedule.saturday_hours || 0),
        sunday_hours: Number(weeklySchedule.sunday_hours || 0),
      });
    }
  }, [weeklySchedule]);

  const handleHourChange = (day: keyof typeof hours, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue < 0 || numValue > 24) {
      toast({
        title: "Invalid Hours",
        description: "Hours must be between 0 and 24",
        variant: "destructive",
      });
      return;
    }
    setHours(prev => ({ ...prev, [day]: numValue }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(hours);
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
      setHours({
        monday_hours: 0,
        tuesday_hours: 0,
        wednesday_hours: 0,
        thursday_hours: 0,
        friday_hours: 0,
        saturday_hours: 0,
        sunday_hours: 0,
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

  const totalHours = Object.values(hours).reduce((sum, h) => sum + h, 0);
  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const dayLabels = [
    { key: 'monday_hours' as const, label: 'Monday' },
    { key: 'tuesday_hours' as const, label: 'Tuesday' },
    { key: 'wednesday_hours' as const, label: 'Wednesday' },
    { key: 'thursday_hours' as const, label: 'Thursday' },
    { key: 'friday_hours' as const, label: 'Friday' },
    { key: 'saturday_hours' as const, label: 'Saturday' },
    { key: 'sunday_hours' as const, label: 'Sunday' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Week of {weekStartDate.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {dayLabels.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Label className="w-24 text-sm">{label}</Label>
              <Input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={hours[key]}
                onChange={(e) => handleHourChange(key, e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">hours</span>
              {hours[key] > 0 && (
                <div className="h-2 w-2 bg-primary rounded-full" />
              )}
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Hours:</span>
            <span className="text-lg font-bold text-primary">{totalHours.toFixed(1)} hours</span>
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
