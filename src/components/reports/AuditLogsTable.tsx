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

  const getActionBadge = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes("create") || lowerAction.includes("insert")) {
      return <Badge className="bg-green-600">Created</Badge>;
    }
    if (lowerAction.includes("update") || lowerAction.includes("edit")) {
      return <Badge className="bg-blue-600">Updated</Badge>;
    }
    if (lowerAction.includes("delete") || lowerAction.includes("remove")) {
      return <Badge className="bg-red-600">Deleted</Badge>;
    }
    if (lowerAction.includes("login")) {
      return <Badge className="bg-purple-600">Login</Badge>;
    }
    if (lowerAction.includes("logout")) {
      return <Badge className="bg-gray-600">Logout</Badge>;
    }
    return <Badge variant="outline">{action}</Badge>;
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
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditData.map((log) => {
                const isExpanded = expandedRows.has(log.id);
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
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {typeof log.details === "string"
                          ? log.details
                          : log.details
                          ? "Click to expand"
                          : "-"}
                      </TableCell>
                    </TableRow>
                    {isExpanded && log.details && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-muted/30">
                          <div className="p-4">
                            <h4 className="font-semibold mb-2">Details:</h4>
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
