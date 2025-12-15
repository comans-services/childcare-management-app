import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimesheetEntry } from "@/lib/timesheet-service";
import { formatDateDisplay } from "@/lib/date-utils";
import { ReportFiltersType } from "@/pages/ReportsPage";
import { LEAVE_TYPE_ABBREVIATIONS } from "@/components/timesheet/time-entry/schema";

interface ReportDataTableProps {
  reportData: TimesheetEntry[];
  filters: ReportFiltersType;
  isLoading?: boolean;
}

export const ReportDataTable: React.FC<ReportDataTableProps> = ({ 
  reportData = [], 
  filters, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timesheet Report Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading report data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!reportData || reportData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timesheet Report Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data found. Generate a report to see results.</p>
        </CardContent>
      </Card>
    );
  }

  const totalHours = reportData.reduce((sum, entry) => sum + entry.hours_logged, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timesheet Report Data ({reportData.length} entries)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDateDisplay(new Date(entry.entry_date))}</TableCell>
                  <TableCell>{entry.user_full_name || 'Unknown'}</TableCell>
                  <TableCell>{entry.profiles?.employee_id || '-'}</TableCell>
                  <TableCell>
                    {entry.leave_type ? (
                      <Badge variant="outline" className="text-xs">
                        {LEAVE_TYPE_ABBREVIATIONS[entry.leave_type] || entry.leave_type}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{entry.start_time}</TableCell>
                  <TableCell>{entry.end_time}</TableCell>
                  <TableCell className="text-right">{entry.hours_logged.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell colSpan={6} className="text-right">Total Hours:</TableCell>
                <TableCell className="text-right">{totalHours.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportDataTable;
