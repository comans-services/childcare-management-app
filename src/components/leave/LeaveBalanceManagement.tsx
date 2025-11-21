import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Briefcase } from "lucide-react";
import { LeaveBalance, fetchUserLeaveBalances, updateLeaveBalance } from "@/lib/leave-service";
import { useToast } from "@/hooks/use-toast";
import UserSelector from "@/components/timesheet/UserSelector";
import { supabase } from "@/integrations/supabase/client";

const LeaveBalanceManagement = () => {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userEmploymentType, setUserEmploymentType] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedUserId) {
      loadUserBalances(selectedUserId);
    } else {
      setBalances([]);
    }
  }, [selectedUserId]);

  const loadUserBalances = async (userId: string) => {
    setLoading(true);
    try {
      // First check if user is full-time
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('employment_type')
        .eq('id', userId)
        .single();

      setUserEmploymentType(userProfile?.employment_type || null);

      if (userProfile?.employment_type !== 'full-time') {
        setBalances([]);
        setLoading(false);
        return;
      }

      const data = await fetchUserLeaveBalances(userId);
      setBalances(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load leave balances.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (balance: LeaveBalance) => {
    setEditingId(balance.id);
    setEditValue(balance.total_days.toString());
  };

  const handleSave = async () => {
    if (!editingId || !selectedUserId) return;
    
    try {
      await updateLeaveBalance(editingId, { total_days: parseFloat(editValue) });
      toast({
        title: "Balance Updated",
        description: "Leave balance has been updated successfully.",
      });
      setEditingId(null);
      loadUserBalances(selectedUserId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update leave balance.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Leave Balance Management</CardTitle>
          <div className="flex items-center gap-4">
            <UserSelector
              selectedUserId={selectedUserId}
              onSelectUser={setSelectedUserId}
              className="w-72"
              showCurrentUserOption={false}
              placeholderText="Select an employee"
            />
          </div>
        </CardHeader>
      </Card>

      {!selectedUserId ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Please select an employee to view their leave balances.
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            Loading leave balances...
          </CardContent>
        </Card>
      ) : userEmploymentType === 'part-time' ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">Leave Balances Not Available</h3>
              <p className="text-muted-foreground">
                Leave balances are only available for full-time employees.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : balances.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No leave balances found for the selected employee.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Total Days</TableHead>
                  <TableHead>Used Days</TableHead>
                  <TableHead>Remaining Days</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((balance) => (
                  <TableRow key={balance.id}>
                    <TableCell>{balance.leave_type?.name}</TableCell>
                    <TableCell>
                      {editingId === balance.id ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          type="number"
                          className="w-20"
                        />
                      ) : (
                        balance.total_days
                      )}
                    </TableCell>
                    <TableCell>{balance.used_days}</TableCell>
                    <TableCell>{balance.remaining_days}</TableCell>
                    <TableCell>
                      {editingId === balance.id ? (
                        <div className="space-x-2">
                          <Button size="sm" onClick={handleSave}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(balance)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeaveBalanceManagement;