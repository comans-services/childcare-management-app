
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus, Settings, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatDate, formatDateDisplay } from "@/lib/date-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Holiday {
  id: string;
  date: string;
  name: string;
  state: string;
  year: number;
}

interface UserHolidayPermission {
  id: string;
  user_id: string;
  allow_holiday_entries: boolean;
  profiles?: {
    full_name?: string;
    email: string;
  };
}

const HolidayManagement: React.FC = () => {
  const [newHolidayOpen, setNewHolidayOpen] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayDescription, setNewHolidayDescription] = useState("");
  
  const queryClient = useQueryClient();

  // Fetch upcoming holidays
  const { data: holidays, isLoading: holidaysLoading } = useQuery({
    queryKey: ["admin-holidays"],
    queryFn: async () => {
      const currentDate = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(currentDate.getFullYear() + 1);
      
      const { data, error } = await supabase
        .from("public_holidays")
        .select("*")
        .gte("date", formatDate(currentDate))
        .lte("date", formatDate(nextYear))
        .eq("state", "VIC")
        .order("date", { ascending: true });

      if (error) throw error;
      return data as Holiday[];
    },
  });

  // Fetch user holiday permissions
  const { data: userPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["user-holiday-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_schedules")
        .select(`
          id,
          user_id,
          allow_holiday_entries,
          profiles (
            full_name,
            email
          )
        `)
        .order("profiles(full_name)", { ascending: true });

      if (error) throw error;
      
      return data as UserHolidayPermission[];
    },
  });

  // Add custom holiday mutation
  const addHolidayMutation = useMutation({
    mutationFn: async (holidayData: { name: string; date: string; description?: string }) => {
      const year = new Date(holidayData.date).getFullYear();
      
      const { data, error } = await supabase
        .from("public_holidays")
        .insert({
          name: holidayData.name,
          date: holidayData.date,
          state: "VIC",
          year: year,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Holiday Added",
        description: "Custom holiday has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-holidays"] });
      setNewHolidayOpen(false);
      setNewHolidayName("");
      setNewHolidayDate("");
      setNewHolidayDescription("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add holiday. " + error.message,
        variant: "destructive",
      });
    },
  });

  // Update user permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ userId, allowHolidayEntries }: { userId: string; allowHolidayEntries: boolean }) => {
      const { error } = await supabase
        .from("work_schedules")
        .update({ allow_holiday_entries: allowHolidayEntries })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Permission Updated",
        description: "User holiday permission has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["user-holiday-permissions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update permission. " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddHoliday = () => {
    if (!newHolidayName.trim() || !newHolidayDate) {
      toast({
        title: "Validation Error",
        description: "Please provide both holiday name and date.",
        variant: "destructive",
      });
      return;
    }

    addHolidayMutation.mutate({
      name: newHolidayName.trim(),
      date: newHolidayDate,
      description: newHolidayDescription.trim() || undefined,
    });
  };

  const handlePermissionToggle = (userId: string, currentValue: boolean) => {
    updatePermissionMutation.mutate({
      userId,
      allowHolidayEntries: !currentValue,
    });
  };

  const upcomingHolidays = holidays?.slice(0, 10) || [];
  const totalHolidaysThisYear = holidays?.filter(h => h.year === new Date().getFullYear()).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Holiday Management
          </h2>
          <p className="text-muted-foreground">
            Manage public holidays and user permissions for holiday entries
          </p>
        </div>
        
        <Dialog open={newHolidayOpen} onOpenChange={setNewHolidayOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Holiday
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Holiday</DialogTitle>
              <DialogDescription>
                Add a custom company holiday that will be applied to all users.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="holiday-name">Holiday Name</Label>
                <Input
                  id="holiday-name"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  placeholder="e.g., Company Retreat Day"
                />
              </div>
              
              <div>
                <Label htmlFor="holiday-date">Date</Label>
                <Input
                  id="holiday-date"
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="holiday-description">Description (Optional)</Label>
                <Textarea
                  id="holiday-description"
                  value={newHolidayDescription}
                  onChange={(e) => setNewHolidayDescription(e.target.value)}
                  placeholder="Additional details about this holiday..."
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setNewHolidayOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddHoliday}
                disabled={addHolidayMutation.isPending}
              >
                {addHolidayMutation.isPending ? "Adding..." : "Add Holiday"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingHolidays.length}</div>
            <p className="text-xs text-muted-foreground">Next 12 months</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Year Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHolidaysThisYear}</div>
            <p className="text-xs text-muted-foreground">Victoria public holidays</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Users with Holiday Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userPermissions?.filter(u => u.allow_holiday_entries).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {userPermissions?.length || 0} total users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Holidays */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Victoria Public Holidays
          </CardTitle>
        </CardHeader>
        <CardContent>
          {holidaysLoading ? (
            <div className="text-center py-4">Loading holidays...</div>
          ) : upcomingHolidays.length > 0 ? (
            <div className="space-y-2">
              {upcomingHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{holiday.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateDisplay(new Date(holiday.date))}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {holiday.state}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No upcoming holidays found
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Holiday Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Holiday Permissions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Control which users can create timesheet entries on public holidays
          </p>
        </CardHeader>
        <CardContent>
          {permissionsLoading ? (
            <div className="text-center py-4">Loading user permissions...</div>
          ) : userPermissions && userPermissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Holiday Entries Allowed</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userPermissions.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">
                        {user.profiles?.full_name || "No name"}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.profiles?.email || "No email"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.allow_holiday_entries ? "default" : "secondary"}>
                        {user.allow_holiday_entries ? "Allowed" : "Blocked"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.allow_holiday_entries}
                          onCheckedChange={() => handlePermissionToggle(user.user_id, user.allow_holiday_entries)}
                          disabled={updatePermissionMutation.isPending}
                        />
                        <Label className="text-sm">
                          {user.allow_holiday_entries ? "Allow" : "Block"}
                        </Label>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No users found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HolidayManagement;
