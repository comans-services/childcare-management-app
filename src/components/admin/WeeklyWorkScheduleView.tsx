
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek } from "date-fns";
import { useWeeklyWorkSchedule } from "@/hooks/useWeeklyWorkSchedule";

interface WeeklyWorkScheduleViewProps {
  user: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
  };
}

const WeeklyWorkScheduleView: React.FC<WeeklyWorkScheduleViewProps> = ({ user }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { weeklyHours, totalWeeklyHours, updateDayHours, loading } = useWeeklyWorkSchedule(user.id, currentWeek);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  const days = [
    { key: 'monday_hours' as const, label: 'Monday' },
    { key: 'tuesday_hours' as const, label: 'Tuesday' },
    { key: 'wednesday_hours' as const, label: 'Wednesday' },
    { key: 'thursday_hours' as const, label: 'Thursday' },
    { key: 'friday_hours' as const, label: 'Friday' },
    { key: 'saturday_hours' as const, label: 'Saturday' },
    { key: 'sunday_hours' as const, label: 'Sunday' }
  ];

  const handleHoursChange = (day: keyof typeof weeklyHours, value: string) => {
    const hours = parseFloat(value) || 0;
    updateDayHours(day, hours);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading weekly schedule...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule - {user.full_name || user.email}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Total: {totalWeeklyHours}h/week
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
          >
            Today
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {days.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium">{label}</label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={weeklyHours[key]}
                  onChange={(e) => handleHoursChange(key, e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-2 top-2 text-xs text-muted-foreground">h</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Week of {format(weekStart, 'MMM d, yyyy')}</span>
            <span className="font-medium">Total: {totalWeeklyHours} hours</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyWorkScheduleView;
