
import React from "react";
import { AuditLogEntry } from "@/lib/audit/audit-service";
import { User } from "@/lib/user-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateDisplay } from "@/lib/date-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FileX, Shield } from "lucide-react";

interface AuditLogsTableProps {
  auditData: AuditLogEntry[];
  users: User[];
  isLoading: boolean;
}

const AuditLogsTable = ({ auditData, users, isLoading }: AuditLogsTableProps) => {
  // Create map for quick user lookups
  const userMap = React.useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(user => map.set(user.id, user));
    return map;
  }, [users]);

  if (isLoading) {
    return (
      <div className="rounded-md border">
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
            {Array(8).fill(0).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (auditData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <Shield className="h-12 w-12 text-gray-400" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">No audit logs found</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-sm">
            No audit entries match your current filters. Try adjusting the date range or removing some filters.
          </p>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'created':
        return 'bg-green-100 text-green-800';
      case 'update':
      case 'updated':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
      case 'deleted':
        return 'bg-red-100 text-red-800';
      case 'assign':
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'lock':
      case 'locked':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEntityType = (entityType: string) => {
    return entityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div>
      <div className="rounded-md border">
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
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(entry.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{entry.user_name}</span>
                    <span className="text-xs text-gray-500">
                      {userMap.get(entry.user_id)?.email || 'Unknown'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(entry.action)}`}>
                    {entry.action}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{formatEntityType(entry.entity_type)}</span>
                    {entry.entity_name && (
                      <span className="text-xs text-gray-500">{entry.entity_name}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="text-sm">{entry.description}</p>
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <details className="mt-1">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        View details
                      </summary>
                      <pre className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        Showing {auditData.length} audit log {auditData.length === 1 ? 'entry' : 'entries'}
      </div>
    </div>
  );
};

export default AuditLogsTable;
