
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Lock, Unlock, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, User } from "@/lib/user-service";
import {
  lockUserTimesheet,
  unlockUserTimesheet,
  bulkLockTimesheets,
  bulkUnlockTimesheets,
  getGlobalLockStatus,
  GlobalLockStatus
} from "@/lib/timesheet-lock-service";

const TimesheetLockManager: React.FC = () => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [lockDate, setLockDate] = useState<Date>();
  const [lockReason, setLockReason] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  const { data: globalStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['global-lock-status'],
    queryFn: getGlobalLockStatus,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const lockMutation = useMutation({
    mutationFn: async ({ userIds, date, reason }: { userIds: string[], date: string, reason?: string }) => {
      if (userIds.length === 1) {
        return await lockUserTimesheet(userIds[0], date, reason);
      } else {
        return await bulkLockTimesheets(userIds, date, reason);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Timesheet${selectedUsers.length > 1 ? 's' : ''} locked successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['global-lock-status'] });
      setSelectedUsers([]);
      setLockDate(undefined);
      setLockReason("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to lock timesheet",
        variant: "destructive"
      });
    }
  });

  const unlockMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      if (userIds.length === 1) {
        return await unlockUserTimesheet(userIds[0]);
      } else {
        return await bulkUnlockTimesheets(userIds);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Timesheet${selectedUsers.length > 1 ? 's' : ''} unlocked successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['global-lock-status'] });
      setSelectedUsers([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unlock timesheet",
        variant: "destructive"
      });
    }
  });

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleLock = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to lock",
        variant: "destructive"
      });
      return;
    }

    if (!lockDate) {
      toast({
        title: "No date selected",
        description: "Please select a lock-until date",
        variant: "destructive"
      });
      return;
    }

    lockMutation.mutate({
      userIds: selectedUsers,
      date: format(lockDate, "yyyy-MM-dd"),
      reason: lockReason.trim() || undefined
    });
  };

  const handleUnlock = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to unlock",
        variant: "destructive"
      });
      return;
    }

    unlockMutation.mutate(selectedUsers);
  };

  const lockedUsers = users.filter(user => user.locked_until_date);
  const unlockedUsers = users.filter(user => !user.locked_until_date);

  if (usersLoading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Global Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Timesheet Lock Overview
          </CardTitle>
          <CardDescription>
            Current status of timesheet locks across all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div>Loading status...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {globalStatus?.total_users_locked || 0}
                </div>
                <div className="text-sm text-gray-600">Locked Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {users.length - (globalStatus?.total_users_locked || 0)}
                </div>
                <div className="text-sm text-gray-600">Unlocked Users</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">
                  {globalStatus?.earliest_lock_date ? format(new Date(globalStatus.earliest_lock_date), "MMM d") : "N/A"}
                </div>
                <div className="text-sm text-gray-600">Earliest Lock</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">
                  {globalStatus?.latest_lock_date ? format(new Date(globalStatus.latest_lock_date), "MMM d") : "N/A"}
                </div>
                <div className="text-sm text-gray-600">Latest Lock</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lock Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Timesheet Locks</CardTitle>
          <CardDescription>
            Lock or unlock user timesheets to prevent entries before specific dates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lock Configuration */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lock-date">Lock Until Date</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !lockDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {lockDate ? format(lockDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={lockDate}
                      onSelect={(date) => {
                        setLockDate(date);
                        setCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lock-reason">Reason (Optional)</Label>
                <Input
                  id="lock-reason"
                  placeholder="e.g., End of month processing"
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleLock}
                disabled={lockMutation.isPending || selectedUsers.length === 0 || !lockDate}
                className="flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Lock Selected ({selectedUsers.length})
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleUnlock}
                disabled={unlockMutation.isPending || selectedUsers.length === 0}
                className="flex items-center gap-2"
              >
                <Unlock className="h-4 w-4" />
                Unlock Selected ({selectedUsers.length})
              </Button>
            </div>
          </div>

          <Separator />

          {/* User Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Select Users</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedUsers.length === users.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm">
                  Select All ({users.length})
                </Label>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                    />
                    <div>
                      <div className="font-medium">{user.full_name || "Unnamed User"}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {user.locked_until_date ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Locked until {format(new Date(user.locked_until_date), "MMM d")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Unlock className="h-3 w-3" />
                        Unlocked
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimesheetLockManager;
