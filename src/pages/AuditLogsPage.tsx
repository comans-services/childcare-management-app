
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs, type AuditLogEntry } from "@/lib/audit/audit-service";
import { fetchUsers } from "@/lib/user-service";
import { format } from "date-fns";
import { Calendar, Filter, Download, Search, Clock, User, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AuditLogsPage = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    action: '',
    entityType: '',
    search: ''
  });
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // Fetch audit logs
  const { data: auditLogs, isLoading, error } = useQuery({
    queryKey: ['audit-logs', filters, page],
    queryFn: () => fetchAuditLogs({
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      userId: filters.userId || undefined,
      action: filters.action || undefined,
      entityType: filters.entityType || undefined,
      limit: pageSize,
      offset: page * pageSize
    })
  });

  // Fetch users for filter dropdown
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  // Filter logs by search term locally
  const filteredLogs = auditLogs?.filter(log => 
    !filters.search || 
    log.description.toLowerCase().includes(filters.search.toLowerCase()) ||
    log.user_name.toLowerCase().includes(filters.search.toLowerCase()) ||
    log.entity_name?.toLowerCase().includes(filters.search.toLowerCase())
  ) || [];

  const actionTypes = [
    'user_created', 'user_updated', 'role_changed',
    'project_created', 'project_updated', 'project_deleted',
    'contract_created', 'contract_updated', 'contract_deleted',
    'user_assigned_to_project', 'user_removed_from_project',
    'user_assigned_to_contract', 'user_removed_from_contract',
    'timesheet_entry_created', 'timesheet_entry_updated', 'timesheet_entry_deleted',
    'budget_override', 'timesheet_locked', 'timesheet_unlocked',
    'work_schedule_changed'
  ];

  const entityTypes = [
    'user', 'project', 'contract', 'timesheet_entry',
    'project_assignment', 'contract_assignment', 'work_schedule'
  ];

  const getActionBadgeColor = (action: string) => {
    if (action.includes('created') || action.includes('assigned')) return 'bg-green-100 text-green-800';
    if (action.includes('deleted') || action.includes('removed')) return 'bg-red-100 text-red-800';
    if (action.includes('updated') || action.includes('changed')) return 'bg-blue-100 text-blue-800';
    if (action.includes('locked')) return 'bg-orange-100 text-orange-800';
    if (action.includes('unlocked')) return 'bg-emerald-100 text-emerald-800';
    if (action.includes('override')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleExport = async () => {
    try {
      // Fetch all logs for export (without pagination)
      const allLogs = await fetchAuditLogs({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        userId: filters.userId || undefined,
        action: filters.action || undefined,
        entityType: filters.entityType || undefined
      });

      // Create CSV content
      const csvContent = [
        ['Date', 'User', 'Action', 'Entity Type', 'Description'].join(','),
        ...allLogs.map(log => [
          format(new Date(log.created_at!), 'yyyy-MM-dd HH:mm:ss'),
          log.user_name,
          log.action,
          log.entity_type,
          `"${log.description}"`
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export completed",
        description: "Audit logs have been exported to CSV file.",
      });
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast({
        title: "Export failed",
        description: "Failed to export audit logs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userId: '',
      action: '',
      entityType: '',
      search: ''
    });
    setPage(0);
  };

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <h3 className="text-lg font-semibold">Access Denied</h3>
              <p className="mt-2">You don't have permission to view audit logs. Admin role required.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Audit Logs
        </h1>
        <p className="text-gray-600 text-sm sm:text-base lg:text-lg mt-2">
          Track all user actions and system events
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">User</label>
              <Select value={filters.userId} onValueChange={(value) => setFilters(prev => ({ ...prev, userId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All users</SelectItem>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Action</label>
              <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search descriptions, users, entities..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={handleExport} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            {filteredLogs.length} {filteredLogs.length === 1 ? 'event' : 'events'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No audit logs found</h3>
              <p className="text-gray-600">No activity matches your current filters.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {log.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.user_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.created_at!), 'MMM dd, yyyy HH:mm')}
                      </span>
                      {log.entity_name && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {log.entity_name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Badge 
                      variant="secondary" 
                      className={getActionBadgeColor(log.action)}
                    >
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {filteredLogs.length === pageSize && (
            <div className="flex justify-center mt-6">
              <Button 
                onClick={() => setPage(prev => prev + 1)}
                variant="outline"
              >
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsPage;
