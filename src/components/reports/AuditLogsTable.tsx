
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { User } from "@/lib/user-service";
import { AuditLogEntry } from "@/lib/audit/audit-service";

interface AuditLogsTableProps {
  auditData: AuditLogEntry[];
  users: User[];
  isLoading: boolean;
}

const AuditLogsTable = ({ auditData, users, isLoading }: AuditLogsTableProps) => {
  // Get action badge variant based on action type
  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes('created')) return 'default';
    if (action.includes('updated')) return 'secondary';
    if (action.includes('deleted') || action.includes('unassigned')) return 'destructive';
    if (action.includes('assigned')) return 'outline';
    if (action.includes('report_generated') || action.includes('audit_report_generated')) return 'default';
    return 'default';
  };

  // Format action text for display with comprehensive formatting including team member and report generation actions
  const formatAction = (action: string): string => {
    const actionMap: Record<string, string> = {
      'entry_created': 'Entry Created',
      'entry_updated': 'Entry Updated',
      'entry_deleted': 'Entry Deleted',
      'project_created': 'Project Created',
      'project_updated': 'Project Updated',
      'project_deleted': 'Project Deleted',
      'contract_created': 'Contract Created',
      'contract_updated': 'Contract Updated',
      'contract_deleted': 'Contract Deleted',
      'user_assigned': 'User Assigned',
      'user_unassigned': 'User Unassigned',
      'member_created': 'Member Added',
      'member_updated': 'Member Updated',
      'member_deleted': 'Member Deleted',
      'report_generated': 'Report Generated',
      'audit_report_generated': 'Audit Report Generated'
    };
    
    return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get user display name
  const getUserDisplayName = (userId: string, userName: string): string => {
    if (userName && userName !== 'Unknown User') return userName;
    const user = users.find(u => u.id === userId);
    return user ? (user.full_name || user.email || 'Unknown User') : 'Unknown User';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>Loading comprehensive audit trail...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (auditData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>No audit logs found for the selected criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No audit entries match your current filters.</p>
            <p className="text-sm mt-1">Try adjusting the date range or removing filters.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          Complete audit trail showing all user actions including creates, updates, deletions, assignments, team member management, and report generation ({auditData.length} entries)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditData.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm">
                    {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {getUserDisplayName(entry.user_id, entry.user_name)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(entry.action)}>
                      {formatAction(entry.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {entry.entity_name || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate" title={entry.description}>
                      {entry.description}
                    </div>
                    {entry.details && (
                      <details className="mt-1">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          View details
                        </summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AuditLogsTable;
