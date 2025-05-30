
import React from "react";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import { User } from "@/lib/user-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateDisplay } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FileX, Filter } from "lucide-react";

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
              <TableHead>Jira Task ID</TableHead>
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
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Show fallback UI only after attempting fetch and getting no results
  if (reportData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <FileX className="h-12 w-12 text-gray-400" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">No data found</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-sm">
            No timesheet entries match your current filters. Try adjusting the date range or removing some filters.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded">
          <Filter className="h-3 w-3" />
          <span>Tip: Use "Generate Report" button to fetch data with your current filters</span>
        </div>
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
              <TableHead>Jira Task ID</TableHead>
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
                  <TableCell className="max-w-xs truncate">{entry.jira_task_id || '-'}</TableCell>
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
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ReportDataTable;
