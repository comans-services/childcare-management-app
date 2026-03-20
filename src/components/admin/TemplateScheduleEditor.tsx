import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, Save, RotateCcw, Clock, Info } from "lucide-react";
import { WorkSchedule } from "@/lib/work-schedule-service";

interface TemplateScheduleEditorProps {
  userId: string;
  currentTemplate: WorkSchedule | null;
  onSave: (templateHours: {
    monday_hours: number;
    tuesday_hours: number;
    wednesday_hours: number;
    thursday_hours: number;
    friday_hours: number;
    saturday_hours: number;
    sunday_hours: number;
  }) => Promise<void>;
  onClear: () => Promise<void>;
}

const DEFAULT_DAY_HOURS = 8;

const dayLabels = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const TemplateScheduleEditor: React.FC<TemplateScheduleEditorProps> = ({
  userId,
  currentTemplate,
  onSave,
  onClear,
}) => {
  // Store which days are working days (true = working)
  const [workingDays, setWorkingDays] = useState<Record<string, boolean>>({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  });
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (currentTemplate) {
      setWorkingDays({
        monday: (currentTemplate.monday_hours || 0) > 0,
        tuesday: (currentTemplate.tuesday_hours || 0) > 0,
        wednesday: (currentTemplate.wednesday_hours || 0) > 0,
        thursday: (currentTemplate.thursday_hours || 0) > 0,
        friday: (currentTemplate.friday_hours || 0) > 0,
        saturday: (currentTemplate.saturday_hours || 0) > 0,
        sunday: (currentTemplate.sunday_hours || 0) > 0,
      });
    }
  }, [currentTemplate]);

  const handleDayToggle = (day: string, checked: boolean) => {
    setWorkingDays(prev => ({ ...prev, [day]: checked }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        monday_hours: workingDays.monday ? DEFAULT_DAY_HOURS : 0,
        tuesday_hours: workingDays.tuesday ? DEFAULT_DAY_HOURS : 0,
        wednesday_hours: workingDays.wednesday ? DEFAULT_DAY_HOURS : 0,
        thursday_hours: workingDays.thursday ? DEFAULT_DAY_HOURS : 0,
        friday_hours: workingDays.friday ? DEFAULT_DAY_HOURS : 0,
        saturday_hours: workingDays.saturday ? DEFAULT_DAY_HOURS : 0,
        sunday_hours: workingDays.sunday ? DEFAULT_DAY_HOURS : 0,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await onClear();
      setWorkingDays({
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      });
    } finally {
      setClearing(false);
    }
  };

  const activeDays = Object.values(workingDays).filter(Boolean).length;
  const hasSchedule = activeDays > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Default Schedule
            </CardTitle>
            <CardDescription className="text-sm">
              Tick the days this employee is scheduled to work each week
            </CardDescription>
          </div>
          {hasSchedule && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {activeDays} day{activeDays !== 1 ? "s" : ""}/week
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This default schedule applies to all weeks unless overridden using the Weekly Schedule tab.
          </AlertDescription>
        </Alert>

        <div className="grid gap-3">
          {dayLabels.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Checkbox
                id={`template-${key}`}
                checked={workingDays[key] ?? false}
                onCheckedChange={(checked) => handleDayToggle(key, !!checked)}
              />
              <Label
                htmlFor={`template-${key}`}
                className="w-28 text-sm cursor-pointer select-none"
              >
                {label}
              </Label>
              {workingDays[key] && (
                <Badge variant="outline" className="text-xs">
                  Working day
                </Badge>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{activeDays}</span> working day{activeDays !== 1 ? "s" : ""} selected
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving || clearing}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Schedule"}
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            disabled={saving || clearing || !hasSchedule}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {clearing ? "Clearing..." : "Clear Schedule"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateScheduleEditor;
