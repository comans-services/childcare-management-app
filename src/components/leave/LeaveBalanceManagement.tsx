import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit } from "lucide-react";
import { LeaveBalance, fetchUserLeaveBalances, updateLeaveBalance } from "@/lib/leave-service";
import { useToast } from "@/hooks/use-toast";
import UserSelector from "@/components/timesheet/UserSelector";

const LeaveBalanceManagement = () => {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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