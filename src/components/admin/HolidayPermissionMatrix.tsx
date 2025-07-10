
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Calendar, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface HolidayPermissionMatrix {
  holiday_id: string;
  holiday_name: string;
  holiday_date: string;
  user_id: string;
  user_name: string;
  user_email: string;
  specific_permission: boolean | null;
  general_permission: boolean;
  effective_permission: boolean;
  permission_source: string;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
}

const HolidayPermissionMatrix: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedHolidayId, setSelectedHolidayId] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch holiday permission matrix
  const { data: permissionMatrix, isLoading } = useQuery({
    queryKey: ["holiday-permission-matrix", selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_holiday_permission_matrix', {
        p_year: selectedYear
      });

      if (error) throw error;
      return data as HolidayPermissionMatrix[];
    },
  });

  // Get unique holidays for dropdown, filtering out past holidays
  const holidays: Holiday[] = React.useMemo(() => {
    if (!permissionMatrix) return [];
    
    const today = new Date();
    const uniqueHolidays = new Map<string, Holiday>();
    
    permissionMatrix.forEach(item => {
      const holidayDate = new Date(item.holiday_date);
      // Only include holidays that are today or in the future
      if (holidayDate >= today && !uniqueHolidays.has(item.holiday_id)) {
        uniqueHolidays.set(item.holiday_id, {
          id: item.holiday_id,
          name: item.holiday_name,
          date: item.holiday_date
        });
      }
    });
    
    return Array.from(uniqueHolidays.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [permissionMatrix]);

  // Get users for selected holiday
  const selectedHolidayUsers = React.useMemo(() => {
    if (!permissionMatrix || !selectedHolidayId) return [];
    
    return permissionMatrix.filter(item => item.holiday_id === selectedHolidayId);
  }, [permissionMatrix, selectedHolidayId]);

  // Set first holiday as default when holidays load
  React.useEffect(() => {
    if (holidays.length > 0 && !selectedHolidayId) {
      setSelectedHolidayId(holidays[0].id);
    }
  }, [holidays, selectedHolidayId]);

  // Clear selected holiday if it's no longer available (past holiday)
  React.useEffect(() => {
    if (selectedHolidayId && !holidays.find(h => h.id === selectedHolidayId)) {
      setSelectedHolidayId(holidays.length > 0 ? holidays[0].id : "");
    }
  }, [holidays, selectedHolidayId]);

  // Toggle specific permission mutation
  const togglePermissionMutation = useMutation({
    mutationFn: async ({ userId, holidayId, currentPermission }: { 
      userId: string; 
      holidayId: string; 
      currentPermission: boolean | null;
    }) => {
      if (currentPermission === null) {
        // Create new specific permission
        const { error } = await supabase
          .from("user_holiday_permissions")
          .insert({
            user_id: userId,
            holiday_id: holidayId,
            is_allowed: true,
          });
        if (error) throw error;
      } else {
        // Update existing specific permission
        const { error } = await supabase
          .from("user_holiday_permissions")
          .update({ is_allowed: !currentPermission })
          .eq("user_id", userId)
          .eq("holiday_id", holidayId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Permission Updated",
        description: "Holiday permission has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["holiday-permission-matrix"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update permission. " + error.message,
        variant: "destructive",
      });
    },
  });

  // Remove specific permission mutation
  const removePermissionMutation = useMutation({
    mutationFn: async ({ userId, holidayId }: { userId: string; holidayId: string }) => {
      const { error } = await supabase
        .from("user_holiday_permissions")
        .delete()
        .eq("user_id", userId)
        .eq("holiday_id", holidayId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Permission Removed",
        description: "Specific holiday permission has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["holiday-permission-matrix"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove permission. " + error.message,
        variant: "destructive",
      });
    },
  });

  const getPermissionIcon = (source: string, effective: boolean) => {
    if (source === 'admin_override') {
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
    if (effective) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getPermissionBadge = (source: string, effective: boolean) => {
    if (source === 'admin_override') {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Admin Override</Badge>;
    }
    if (source === 'specific_permission') {
      return effective ? 
        <Badge variant="default" className="bg-green-100 text-green-800">Specific Allow</Badge> :
        <Badge variant="destructive" className="bg-red-100 text-red-800">Specific Block</Badge>;
    }
    return effective ? 
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">General Allow</Badge> :
      <Badge variant="outline" className="bg-gray-50 text-gray-600">General Block</Badge>;
  };

  const handleTogglePermission = (userId: string, holidayId: string, currentPermission: boolean | null) => {
    togglePermissionMutation.mutate({ userId, holidayId, currentPermission });
  };

  const handleRemovePermission = (userId: string, holidayId: string) => {
    removePermissionMutation.mutate({ userId, holidayId });
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading permission matrix...</div>;
  }

  const selectedHoliday = holidays.find(h => h.id === selectedHolidayId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Holiday Permission Matrix ({selectedYear})
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="year-select">Year:</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="holiday-select">Holiday:</Label>
            <Select value={selectedHolidayId} onValueChange={setSelectedHolidayId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a holiday" />
              </SelectTrigger>
              <SelectContent>
                {holidays.map((holiday) => (
                  <SelectItem key={holiday.id} value={holiday.id}>
                    {holiday.name} - {new Date(holiday.date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="matrix">
          <TabsList>
            <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="matrix" className="space-y-6">
            {selectedHoliday && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{selectedHoliday.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedHoliday.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedHolidayUsers.length} users configured
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedHolidayUsers.map((user: HolidayPermissionMatrix) => (
                      <TableRow key={`${user.user_id}-${user.holiday_id}`}>
                        <TableCell className="font-medium">
                          {user.user_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.user_email}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPermissionIcon(user.permission_source, user.effective_permission)}
                            {user.effective_permission ? 'Allowed' : 'Blocked'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPermissionBadge(user.permission_source, user.effective_permission)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.permission_source !== 'admin_override' && (
                              <>
                                <Switch
                                  checked={user.specific_permission ?? user.general_permission}
                                  onCheckedChange={() => handleTogglePermission(
                                    user.user_id, 
                                    user.holiday_id, 
                                    user.specific_permission
                                  )}
                                  disabled={togglePermissionMutation.isPending}
                                />
                                {user.specific_permission !== null && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemovePermission(user.user_id, user.holiday_id)}
                                    disabled={removePermissionMutation.isPending}
                                  >
                                    Reset
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {holidays.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming holidays found for {selectedYear}. All holidays for this year may have already passed.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {permissionMatrix?.filter(p => p.specific_permission !== null).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Specific overrides set</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Allowed Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {permissionMatrix?.filter(p => p.effective_permission).length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Can work on holidays</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Admin Overrides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {permissionMatrix?.filter(p => p.permission_source === 'admin_override').length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Admin users</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default HolidayPermissionMatrix;
