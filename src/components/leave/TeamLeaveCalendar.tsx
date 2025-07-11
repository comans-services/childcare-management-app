import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Users, TrendingUp } from "lucide-react";
import { LeaveBalanceManagementService } from "@/lib/leave/balance-management-service";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface LeaveEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  userId: string;
  leaveTypeId: string;
  reason?: string;
  businessDays: number;
}

const TeamLeaveCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const { data: leaveEvents, isLoading } = useQuery({
    queryKey: ['team-leave-calendar', format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: () => LeaveBalanceManagementService.getTeamLeaveCalendar(
      format(monthStart, 'yyyy-MM-dd'),
      format(monthEnd, 'yyyy-MM-dd')
    ),
  });

  const { data: analytics } = useQuery({
    queryKey: ['leave-analytics', format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: () => LeaveBalanceManagementService.getLeaveAnalytics(
      format(monthStart, 'yyyy-MM-dd'),
      format(monthEnd, 'yyyy-MM-dd')
    ),
  });

  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd
  });

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, LeaveEvent[]> = {};
    
    leaveEvents?.forEach(event => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      // Add event to each day it spans
      let currentDate = startDate;
      while (currentDate <= endDate) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
    });
    
    return grouped;
  }, [leaveEvents]);

  const selectedDateEvents = selectedDate ? eventsByDate[format(selectedDate, 'yyyy-MM-dd')] || [] : [];

  const getLeaveTypeColor = (leaveTypeId: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ];
    return colors[leaveTypeId.length % colors.length];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    setSelectedDate(null);
  };

  if (isLoading) {
    return <div className="p-4">Loading team leave calendar...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Team Leave Calendar</h2>
          <p className="text-muted-foreground">
            Visual overview of team leave and availability
          </p>
        </div>
        
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold min-w-[180px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(currentDate, 'MMMM yyyy')} Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate[dateKey] || [];
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <div
                    key={dateKey}
                    className={`
                      min-h-[100px] p-1 border rounded-md cursor-pointer transition-colors
                      ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}
                      ${!isSameMonth(day, currentDate) ? 'text-muted-foreground bg-muted/20' : ''}
                    `}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-sm font-medium mb-1">
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event, index) => (
                        <div
                          key={`${event.id}-${index}`}
                          className={`text-xs p-1 rounded truncate ${getLeaveTypeColor(event.leaveTypeId)}`}
                          title={event.title}
                        >
                          {event.title.split(' - ')[0]} {/* Show just the name */}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Monthly Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-4 w-4" />
                Month Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Applications:</span>
                <Badge variant="outline">{analytics?.totalApplications || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Days:</span>
                <Badge variant="outline">{analytics?.totalDaysUsed || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg per User:</span>
                <Badge variant="outline">
                  {analytics?.averageDaysPerUser?.toFixed(1) || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Details */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, 'MMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event, index) => (
                      <div key={`${event.id}-${index}`} className="border rounded p-3">
                        <div className="font-medium text-sm">
                          {event.title}
                        </div>
                        {event.reason && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {event.reason}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {event.businessDays} business day{event.businessDays !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No leave scheduled for this date
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Leave Type Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Leave Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics?.byLeaveType && Object.entries(analytics.byLeaveType).map(([type, days]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm">{type}</span>
                    <Badge variant="outline">{days} days</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamLeaveCalendar;