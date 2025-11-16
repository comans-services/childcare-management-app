
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

const HolidayManagement: React.FC = () => {
  const [newHolidayOpen, setNewHolidayOpen] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayDescription, setNewHolidayDescription] = useState("");
  
  const queryClient = useQueryClient();

  // Fetch all holidays from current year and next year
  const { data: holidays, isLoading: holidaysLoading, error: holidaysError } = useQuery({
    queryKey: ["admin-holidays"],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      
      console.log(`Fetching holidays for years ${currentYear} and ${nextYear}`);
      
      const { data, error } = await supabase
        .from("public_holidays")
        .select("*")
        .in("year", [currentYear, nextYear])
        .eq("state", "VIC")
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching holidays:", error);
        throw error;
      }
      
      console.log("Fetched holidays:", data);
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
          profiles!inner (
            full_name,
            email
          )
        `)
        .order("profiles(full_name)", { ascending: true });

      if (error) throw error;
      
      return data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        allow_holiday_entries: item.allow_holiday_entries,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      })) as UserHolidayPermission[];
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

  const currentYear = new Date().getFullYear();
  const allHolidays = holidays || [];
  const upcomingHolidays = allHolidays.filter(h => new Date(h.date) >= new Date()).slice(0, 15);
  const currentYearHolidays = allHolidays.filter(h => h.year === currentYear);
  const nextYearHolidays = allHolidays.filter(h => h.year === currentYear + 1);

  if (holidaysError) {
    console.error("Holiday fetch error:", holidaysError);
  }

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
            Manage public holidays and configure granular user permissions
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

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="permissions">General Permissions</TabsTrigger>
          <TabsTrigger value="specific">Specific Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Holidays</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingHolidays.length}</div>
                <p className="text-xs text-muted-foreground">From today onwards</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{currentYear} Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentYearHolidays.length}</div>
                <p className="text-xs text-muted-foreground">Current year holidays</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{currentYear + 1} Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nextYearHolidays.length}</div>
                <p className="text-xs text-muted-foreground">Next year holidays</p>
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

          {/* All Holidays List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Victoria Public Holidays ({currentYear} - {currentYear + 1})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {holidaysLoading ? (
                <div className="text-center py-4">Loading holidays...</div>
              ) : allHolidays.length > 0 ? (
                <div className="space-y-2">
                  {allHolidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{holiday.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateDisplay(new Date(holiday.date))} • {holiday.year}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {holiday.state}
                        </Badge>
                        {new Date(holiday.date) < new Date() && (
                          <Badge variant="outline">Past</Badge>
                        )}
                        {new Date(holiday.date) >= new Date() && (
                          <Badge variant="default">Upcoming</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No holidays found</h3>
                  <p className="text-muted-foreground mb-4">
                    No Victoria public holidays found for {currentYear} - {currentYear + 1}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          {/* User Holiday Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                General Holiday Permissions
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Control the default holiday entry permissions for each user. These can be overridden on a per-holiday basis.
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
        </TabsContent>

        <TabsContent value="specific">
          <Card>
            <CardHeader>
              <CardTitle>User-Specific Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">User-specific holiday entry permissions feature coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HolidayManagement;
