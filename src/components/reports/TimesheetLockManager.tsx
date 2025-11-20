import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Lock, Unlock, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";

interface WorkSchedule {
  id: string;
  user_id: string;
  locked_until_date: string | null;
  lock_reason: string | null;
  locked_by: string | null;
  profiles?: {
    full_name: string;
    email: string;
  };
  locked_by_profile?: {
    full_name: string;
  };
}

export const TimesheetLockManager: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [lockDateRange, setLockDateRange] = useState<{ from: Date; to?: Date }>({
    from: new Date(),
    to: new Date(),
  });
  const [lockReason, setLockReason] = useState("");
  const [lockedSchedules, setLockedSchedules] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchLockedSchedules();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("is_active", true)
      .order("full_name");
    if (data) setUsers(data);
  };

  const fetchLockedSchedules = async () => {
    const { data, error } = await supabase
      .from("work_schedules")
      .select(`
        id,
        user_id,
        locked_until_date,
        lock_reason,
        locked_by,
        profiles:user_id (full_name, email),
        locked_by_profile:locked_by (full_name)
      `)
      .not("locked_until_date", "is", null)
      .order("locked_until_date", { ascending: false });

    if (error) {
      console.error("Error fetching locked schedules:", error);
      toast({
        title: "Error",
        description: "Failed to fetch locked schedules",
        variant: "destructive",
      });
    } else if (data) {
      setLockedSchedules(data as any);
    }
  };

  const handleLockTimesheets = async () => {
    if (!lockDateRange.from) {
      toast({
        title: "Error",
        description: "Please select a lock date",
        variant: "destructive",
      });
      return;
    }

    if (!lockReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for locking",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const lockUntilDate = lockDateRange.to || lockDateRange.from;
      const userIdsToLock = selectedUserId === "all" 
        ? users.map(u => u.id) 
        : [selectedUserId];

      // Update or insert work schedules with lock information
      for (const userId of userIdsToLock) {
        // Check if work schedule exists
        const { data: existingSchedule } = await supabase
          .from("work_schedules")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (existingSchedule) {
          // Update existing schedule
          await supabase
            .from("work_schedules")
            .update({
              locked_until_date: lockUntilDate.toISOString().split('T')[0],
              lock_reason: lockReason,
              locked_by: user?.id,
            })
            .eq("user_id", userId);
        } else {
          // Create new schedule with lock
          await supabase
            .from("work_schedules")
            .insert({
              user_id: userId,
              locked_until_date: lockUntilDate.toISOString().split('T')[0],
              lock_reason: lockReason,
              locked_by: user?.id,
            });
        }
      }

      toast({
        title: "Success",
        description: `Timesheets locked for ${userIdsToLock.length} user(s) until ${formatDate(lockUntilDate)}`,
      });

      // Reset form
      setSelectedUserId("all");
      setLockReason("");
      fetchLockedSchedules();
    } catch (error) {
      console.error("Error locking timesheets:", error);
      toast({
        title: "Error",
        description: "Failed to lock timesheets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async (scheduleId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from("work_schedules")
        .update({
          locked_until_date: null,
          lock_reason: null,
          locked_by: null,
        })
        .eq("id", scheduleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Timesheet unlocked for ${userName}`,
      });

      fetchLockedSchedules();
    } catch (error) {
      console.error("Error unlocking timesheet:", error);
      toast({
        title: "Error",
        description: "Failed to unlock timesheet",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Lock Section */}
      <Card>
        <CardHeader>
          <CardTitle>Lock Timesheets</CardTitle>
          <CardDescription>
            Prevent users from editing their timesheets until a specified date
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Selection */}
            <div className="space-y-2">
              <Label>Select User(s)</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lock Until Date */}
            <div className="space-y-2">
              <Label>Lock Until Date</Label>
              <DateRangePicker
                value={lockDateRange}
                onChange={(range) => {
                  if (range?.from) {
                    setLockDateRange({
                      from: range.from,
                      to: range.to
                    });
                  }
                }}
              />
            </div>
          </div>

          {/* Lock Reason */}
          <div className="space-y-2">
            <Label>Reason for Lock</Label>
            <Textarea
              placeholder="e.g., End of pay period processing"
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleLockTimesheets}
            disabled={isLoading || !lockDateRange.from || !lockReason.trim()}
            className="w-full"
          >
            <Lock className="mr-2 h-4 w-4" />
            {isLoading ? "Locking..." : "Lock Timesheets"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Locks Section */}
      <Card>
        <CardHeader>
          <CardTitle>Active Timesheet Locks</CardTitle>
          <CardDescription>
            Currently locked timesheets - users cannot edit entries until the lock expires
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lockedSchedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active timesheet locks
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Locked Until</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Locked By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lockedSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {schedule.profiles?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>{schedule.profiles?.email || "-"}</TableCell>
                    <TableCell>
                      {schedule.locked_until_date
                        ? formatDate(new Date(schedule.locked_until_date))
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {schedule.lock_reason || "-"}
                    </TableCell>
                    <TableCell>
                      {schedule.locked_by_profile?.full_name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Unlock className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Unlock Timesheet?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will allow {schedule.profiles?.full_name} to edit their
                              timesheets again. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleUnlock(
                                  schedule.id,
                                  schedule.profiles?.full_name || "user"
                                )
                              }
                            >
                              Unlock
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimesheetLockManager;
