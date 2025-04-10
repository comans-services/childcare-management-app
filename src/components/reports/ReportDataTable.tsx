
import React from "react";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import { User } from "@/lib/user-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateDisplay } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportDataTableProps {
  reportData: TimesheetEntry[];
  projects: Project[];
  users: User[];
  isLoading: boolean;
}

const ReportDataTable = ({ reportData, projects, users, isLoading }: ReportDataTableProps) => {
  // Create maps for quick lookups
  const projectMap = React.useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach(project => map.set(project.id, project));
    return map;
  }, [projects]);
  
  const userMap = React.useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(user => map.set(user.id, user));
    return map;
  }, [users]);

  // Calculate totals
  const totalHours = React.useMemo(() => {
    return reportData.reduce((sum, entry) => sum + entry.hours_logged, 0);
  }, [reportData]);

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (reportData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available. Please adjust your filters and generate a report.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.map((entry) => {
              const project = projectMap.get(entry.project_id);
              const employee = userMap.get(entry.user_id);
              
              return (
                <TableRow key={entry.id}>
                  <TableCell>{formatDateDisplay(new Date(entry.entry_date))}</TableCell>
                  <TableCell>{employee?.full_name || 'Unknown Employee'}</TableCell>
                  <TableCell>{project?.name || 'Unknown Project'}</TableCell>
                  <TableCell>{entry.hours_logged}</TableCell>
                  <TableCell className="max-w-xs truncate">{entry.notes || '-'}</TableCell>
                </TableRow>
              );
            })}
            <TableRow className="font-medium bg-muted/50">
              <TableCell>Total</TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell>{totalHours.toFixed(1)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ReportDataTable;
