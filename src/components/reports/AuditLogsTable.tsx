import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatDateDisplay } from "@/lib/date-utils";

interface AuditLogsTableProps {
  auditData: any[];
  isLoading?: boolean;
}

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return dateStr; }
};

const formatActionDescription = (action: string, details: any): string => {
  const d = details || {};
  const lower = action.toLowerCase();

  // Auth events
  if (lower === "user_login_success") return `Logged in successfully${d.email ? ` (${d.email})` : ""}`;
  if (lower === "user_login_failed") return `Failed login attempt${d.email ? ` for ${d.email}` : ""}`;
  if (lower === "user_logout") return "Logged out";
  if (lower === "password_changed") return "Changed their password";
  if (lower === "user_signup") return `New user registered${d.email ? `: ${d.email}` : ""}`;

  // Holiday events
  if (lower === "public_holiday_created") return `Added public holiday: ${d.name || "Unknown"}${d.date ? ` (${formatDate(d.date)})` : ""}`;
  if (lower === "public_holiday_updated") return `Updated public holiday: ${d.name || "Unknown"}`;
  if (lower === "public_holiday_deleted") return `Removed public holiday: ${d.name || "Unknown"}`;

  // Timesheet events
  if (lower === "timesheet_locked") return `Locked timesheet${d.user_name ? ` for ${d.user_name}` : ""}${d.locked_until ? ` until ${formatDate(d.locked_until)}` : ""}`;
  if (lower === "timesheet_unlocked") return `Unlocked timesheet${d.user_name ? ` for ${d.user_name}` : ""}`;
  if (lower === "timesheet_entry_created") return `Added timesheet entry${d.entry_date ? ` for ${formatDate(d.entry_date)}` : ""}${d.hours_logged ? ` (${d.hours_logged}h)` : ""}`;
  if (lower === "timesheet_entry_updated") return `Updated timesheet entry${d.entry_date ? ` for ${formatDate(d.entry_date)}` : ""}`;
  if (lower === "timesheet_entry_deleted") return `Deleted timesheet entry${d.entry_date ? ` for ${formatDate(d.entry_date)}` : ""}`;

  // Report events
  if (lower === "timesheet_report_generated") return `Generated timesheet report${d.resultCount ? ` (${d.resultCount} entries)` : ""}`;
  if (lower === "audit_report_generated") return `Generated audit report${d.resultCount ? ` (${d.resultCount} entries)` : ""}`;
  if (lower === "report_exported") return `Exported report${d.format ? ` as ${d.format.toUpperCase()}` : ""}`;

  // Team/user management
  if (lower === "user_created") return `Created user: ${d.full_name || d.email || "Unknown"}`;
  if (lower === "user_updated") return `Updated user: ${d.full_name || d.email || "Unknown"}`;
  if (lower === "user_deactivated") return `Deactivated user: ${d.full_name || d.email || "Unknown"}`;
  if (lower === "role_assigned") return `Assigned ${d.role || "role"} to ${d.full_name || d.email || "user"}`;

  // Work schedule
  if (lower === "work_schedule_updated") return `Updated work schedule${d.user_name ? ` for ${d.user_name}` : ""}`;
  if (lower === "weekly_schedule_updated") return `Updated weekly schedule${d.user_name ? ` for ${d.user_name}` : ""}`;

  // CSV import
  if (lower === "csv_import") return `Imported CSV${d.total_rows ? ` (${d.total_rows} rows)` : ""}${d.successful ? `, ${d.successful} successful` : ""}`;

  // Childcare monitor
  if (lower === "staff_entered_room") return `${d.staff_name || "Staff"} entered ${d.room_name || "room"}`;
  if (lower === "staff_exited_room") return `${d.staff_name || "Staff"} exited ${d.room_name || "room"}`;
  if (lower === "room_updated") return `Updated room: ${d.room_name || d.name || "Unknown"}`;
  if (lower === "device_registered") return `Registered device: ${d.device_name || "Unknown"}`;

  // Campaign/mailer
  if (lower === "campaign_created") return `Created email campaign: ${d.subject || "Untitled"}`;
  if (lower === "campaign_sent") return `Sent email campaign${d.total_recipients ? ` to ${d.total_recipients} recipients` : ""}`;

  // DB trigger events (INSERT/UPDATE/DELETE on tables)
  if (d.operation && d.table) {
    const op = d.operation.toLowerCase();
    const table = d.table.replace(/_/g, " ");
    const verb = op === "insert" ? "Created" : op === "update" ? "Updated" : op === "delete" ? "Deleted" : op;
    
    // Extract meaningful fields from record
    const rec = d.record || d.new_record || {};
    const identifier = rec.full_name || rec.name || rec.email || rec.subject || rec.action || rec.entry_date || "";
    
    return `${verb} ${table}${identifier ? `: ${identifier}` : ""}`;
  }

  // Fallback: humanize the action string
  return action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

const getActionCategory = (action: string, details: any): { label: string; className: string } => {
  const lower = action.toLowerCase();
  const table = details?.table?.toLowerCase() || "";

  if (lower.includes("login") || lower.includes("logout") || lower.includes("signup") || lower.includes("password"))
    return { label: "Auth", className: "bg-purple-600" };
  if (lower.includes("holiday") || table === "public_holidays")
    return { label: "Holiday", className: "bg-amber-600" };
  if (lower.includes("timesheet") || lower.includes("timer") || table === "timesheet_entries")
    return { label: "Timesheet", className: "bg-blue-600" };
  if (lower.includes("report") || lower.includes("export"))
    return { label: "Report", className: "bg-cyan-600" };
  if (lower.includes("schedule") || table.includes("schedule"))
    return { label: "Schedule", className: "bg-teal-600" };
  if (lower.includes("room") || lower.includes("staff_entered") || lower.includes("staff_exited") || lower.includes("device") || table.includes("room") || table.includes("childcare"))
    return { label: "Childcare", className: "bg-pink-600" };
  if (lower.includes("campaign") || lower.includes("mailer") || lower.includes("contact") || table === "contacts" || table === "campaigns")
    return { label: "Mailer", className: "bg-orange-600" };
  if (lower.includes("user") || lower.includes("role") || lower.includes("team") || table === "profiles" || table === "user_roles")
    return { label: "Team", className: "bg-indigo-600" };
  if (lower.includes("csv") || lower.includes("import"))
    return { label: "Import", className: "bg-emerald-600" };
  if (lower.includes("lock"))
    return { label: "Lock", className: "bg-red-600" };

  // DB trigger fallback
  if (details?.operation) {
    const op = details.operation.toLowerCase();
    if (op === "insert") return { label: "Created", className: "bg-green-600" };
    if (op === "update") return { label: "Updated", className: "bg-blue-600" };
    if (op === "delete") return { label: "Deleted", className: "bg-red-600" };
  }

  return { label: "System", className: "bg-muted-foreground" };
};

export const AuditLogsTable: React.FC<AuditLogsTableProps> = ({
  auditData,
  isLoading = false,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>Loading audit data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!auditData || auditData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>No audit logs found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground">
              No audit logs found for the selected filters.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>Showing {auditData.length} audit log entries</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>What Happened</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditData.map((log) => {
                const isExpanded = expandedRows.has(log.id);
                const category = getActionCategory(log.action, log.details);
                const description = formatActionDescription(log.action, log.details);
                return (
                  <React.Fragment key={log.id}>
                    <TableRow>
                      <TableCell>
                        {log.details && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(log.id)}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatDateDisplay(new Date(log.created_at))}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell>{log.user_name || "System"}</TableCell>
                      <TableCell>
                        <Badge className={category.className}>{category.label}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {description}
                      </TableCell>
                    </TableRow>
                    {isExpanded && log.details && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/30">
                          <div className="p-4">
                            <h4 className="font-semibold mb-2">Raw Details:</h4>
                            <pre className="text-xs bg-background p-3 rounded-md overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditLogsTable;
