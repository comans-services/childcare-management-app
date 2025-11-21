import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [hours, setHours] = useState({
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  });
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (currentTemplate) {
      setHours({
        monday: currentTemplate.monday_hours || 0,
        tuesday: currentTemplate.tuesday_hours || 0,
        wednesday: currentTemplate.wednesday_hours || 0,
        thursday: currentTemplate.thursday_hours || 0,
        friday: currentTemplate.friday_hours || 0,
        saturday: currentTemplate.saturday_hours || 0,
        sunday: currentTemplate.sunday_hours || 0,
      });
    }
  }, [currentTemplate]);

  const handleHourChange = (day: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue >= 0 && numValue <= 24) {
      setHours(prev => ({
        ...prev,
        [day]: numValue,
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        monday_hours: hours.monday,
        tuesday_hours: hours.tuesday,
        wednesday_hours: hours.wednesday,
        thursday_hours: hours.thursday,
        friday_hours: hours.friday,
        saturday_hours: hours.saturday,
        sunday_hours: hours.sunday,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await onClear();
      setHours({
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      });
    } finally {
      setClearing(false);
    }
  };

  const totalHours = Object.values(hours).reduce((sum, h) => sum + h, 0);
  const workingDays = Object.values(hours).filter(h => h > 0).length;
  const hasTemplate = totalHours > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Default Template Schedule
            </CardTitle>
            <CardDescription className="text-sm">
              Set recurring weekly hours that apply to all weeks unless overridden
            </CardDescription>
          </div>
          {hasTemplate && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {workingDays} days • {totalHours}h/week
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This template will automatically apply to all weeks. You can still override specific weeks using the "Weekly Hours" tab.
          </AlertDescription>
        </Alert>

        <div className="grid gap-3">
          {dayLabels.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Label htmlFor={`template-${key}`} className="w-28 text-sm">
                {label}
              </Label>
              <div className="flex items-center gap-2 flex-1">
                <Input
                  id={`template-${key}`}
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={hours[key as keyof typeof hours]}
                  onChange={(e) => handleHourChange(key, e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">hours</span>
                {hours[key as keyof typeof hours] > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Working day
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm">
            <span className="font-medium">Total:</span>{" "}
            <span className="text-muted-foreground">
              {workingDays} working days • {totalHours} hours/week
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={saving || clearing}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Template"}
          </Button>
          <Button 
            onClick={handleClear} 
            variant="outline"
            disabled={saving || clearing || !hasTemplate}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {clearing ? "Clearing..." : "Clear Template"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateScheduleEditor;
