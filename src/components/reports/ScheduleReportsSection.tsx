import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateDisplay } from "@/lib/date-utils";

interface ScheduleReportsSectionProps {
  scheduleData: any;
  isLoading?: boolean;
}

export const ScheduleReportsSection: React.FC<ScheduleReportsSectionProps> = ({
  scheduleData,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schedule Reports</CardTitle>
          <CardDescription>Loading schedule data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scheduleData || !scheduleData.weeklySchedules || scheduleData.weeklySchedules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schedule Reports</CardTitle>
          <CardDescription>No schedule data found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground">
              No schedule data found for the selected filters.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const calculateWeeklyTotal = (schedule: any) => {
    return (
      Number(schedule.monday_hours || 0) +
      Number(schedule.tuesday_hours || 0) +
      Number(schedule.wednesday_hours || 0) +
      Number(schedule.thursday_hours || 0) +
      Number(schedule.friday_hours || 0) +
      Number(schedule.saturday_hours || 0) +
      Number(schedule.sunday_hours || 0)
    );
  };

  return (
    <div className="space-y-6">
      {/* Weekly Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Work Schedules</CardTitle>
          <CardDescription>
            Showing {scheduleData.weeklySchedules.length} weekly schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Week Start</TableHead>
                  <TableHead>Mon</TableHead>
                  <TableHead>Tue</TableHead>
                  <TableHead>Wed</TableHead>
                  <TableHead>Thu</TableHead>
                  <TableHead>Fri</TableHead>
                  <TableHead>Sat</TableHead>
                  <TableHead>Sun</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduleData.weeklySchedules.map((schedule: any) => {
                  const scheduledHours = calculateWeeklyTotal(schedule);
                  const actualHours = scheduleData.actualHours[schedule.user_id] || 0;
                  const variance = actualHours - scheduledHours;

                  return (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">
                        {schedule.profiles?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {formatDateDisplay(new Date(schedule.week_start_date))}
                      </TableCell>
                      <TableCell>{schedule.monday_hours}</TableCell>
                      <TableCell>{schedule.tuesday_hours}</TableCell>
                      <TableCell>{schedule.wednesday_hours}</TableCell>
                      <TableCell>{schedule.thursday_hours}</TableCell>
                      <TableCell>{schedule.friday_hours}</TableCell>
                      <TableCell>{schedule.saturday_hours}</TableCell>
                      <TableCell>{schedule.sunday_hours}</TableCell>
                      <TableCell className="font-semibold">
                        {scheduledHours.toFixed(1)}
                      </TableCell>
                      <TableCell>{actualHours.toFixed(1)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            variance > 0
                              ? "default"
                              : variance < 0
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {variance > 0 ? "+" : ""}
                          {variance.toFixed(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Global Work Schedules */}
      {scheduleData.globalSchedules && scheduleData.globalSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Default Work Schedules</CardTitle>
            <CardDescription>Standard working days configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Employment Type</TableHead>
                    <TableHead>Working Days</TableHead>
                    <TableHead>Weekend Entries</TableHead>
                    <TableHead>Holiday Entries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduleData.globalSchedules.map((schedule: any) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">
                        {schedule.profiles?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            schedule.profiles?.employment_type === "full-time"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {schedule.profiles?.employment_type || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>{schedule.working_days} days/week</TableCell>
                      <TableCell>
                        {schedule.allow_weekend_entries ? (
                          <Badge className="bg-green-600">Allowed</Badge>
                        ) : (
                          <Badge variant="outline">Blocked</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {schedule.allow_holiday_entries ? (
                          <Badge className="bg-green-600">Allowed</Badge>
                        ) : (
                          <Badge variant="outline">Blocked</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduleReportsSection;
