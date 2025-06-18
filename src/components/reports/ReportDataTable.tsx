
import React from "react";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import { Contract } from "@/lib/contract-service";
import { User } from "@/lib/user-service";
import { ReportFiltersType } from "@/pages/ReportsPage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateDisplay } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FileX, Filter } from "lucide-react";

interface ReportDataTableProps {
  reportData: TimesheetEntry[];
  projects: Project[];
  contracts: Contract[];
  users: User[];
  filters: ReportFiltersType;
  isLoading: boolean;
}

const ReportDataTable = ({ reportData, projects, contracts, users, filters, isLoading }: ReportDataTableProps) => {
  // Create maps for quick lookups
  const projectMap = React.useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach(project => map.set(project.id, project));
    return map;
  }, [projects]);

  const contractMap = React.useMemo(() => {
    const map = new Map<string, Contract>();
    contracts.forEach(contract => map.set(contract.id, contract));
    return map;
  }, [contracts]);
  
  const userMap = React.useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(user => map.set(user.id, user));
    return map;
  }, [users]);

  // Calculate totals
  const totalHours = React.useMemo(() => {
    return reportData.reduce((sum, entry) => sum + entry.hours_logged, 0);
  }, [reportData]);

  // Calculate column count for skeleton and totals row
  const baseColumns = 4; // Date, Employee, Project/Contract, Hours
  const employeeIdColumns = filters.includeEmployeeIds ? 2 : 0; // Employee ID, Employee Card ID
  const taskColumns = 2; // Jira Task ID, Notes
  const totalColumns = baseColumns + employeeIdColumns + taskColumns;

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              {filters.includeEmployeeIds && <TableHead>Employee ID</TableHead>}
              {filters.includeEmployeeIds && <TableHead>Employee Card ID</TableHead>}
              <TableHead>Project/Contract</TableHead>
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
                {filters.includeEmployeeIds && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                {filters.includeEmployeeIds && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
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
              {filters.includeEmployeeIds && <TableHead>Employee ID</TableHead>}
              {filters.includeEmployeeIds && <TableHead>Employee Card ID</TableHead>}
              <TableHead>Project/Contract</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Jira Task ID</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportData.map((entry) => {
              const employee = userMap.get(entry.user_id);
              
              // Get project or contract name based on entry type
              const getProjectContractName = () => {
                if (entry.entry_type === 'project' && entry.project?.name) {
                  return entry.project.name;
                } else if (entry.entry_type === 'contract' && entry.contract?.name) {
                  return entry.contract.name;
                }
                return '-';
              };
              
              return (
                <TableRow key={entry.id}>
                  <TableCell>{formatDateDisplay(new Date(entry.entry_date))}</TableCell>
                  <TableCell>{employee?.full_name || 'Unknown Employee'}</TableCell>
                  {filters.includeEmployeeIds && <TableCell>{employee?.employee_id || '-'}</TableCell>}
                  {filters.includeEmployeeIds && <TableCell>{employee?.employee_card_id || '-'}</TableCell>}
                  <TableCell>{getProjectContractName()}</TableCell>
                  <TableCell>{entry.hours_logged}</TableCell>
                  <TableCell className="max-w-xs truncate">{entry.jira_task_id || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{entry.notes || '-'}</TableCell>
                </TableRow>
              );
            })}
            <TableRow className="font-medium bg-muted/50">
              <TableCell>Total</TableCell>
              <TableCell></TableCell>
              {filters.includeEmployeeIds && <TableCell></TableCell>}
              {filters.includeEmployeeIds && <TableCell></TableCell>}
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
