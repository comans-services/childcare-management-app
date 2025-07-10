import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit } from "lucide-react";
import { LeaveBalance, fetchUserLeaveBalances, updateLeaveBalance } from "@/lib/leave-service";
import { useToast } from "@/hooks/use-toast";

const LeaveBalanceManagement = () => {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadAllBalances();
  }, []);

  const loadAllBalances = async () => {
    setLoading(true);
    try {
      const data = await fetchUserLeaveBalances();
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
    if (!editingId) return;
    
    try {
      await updateLeaveBalance(editingId, { total_days: parseFloat(editValue) });
      toast({
        title: "Balance Updated",
        description: "Leave balance has been updated successfully.",
      });
      setEditingId(null);
      loadAllBalances();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update leave balance.",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
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
                <TableCell>{balance.user_id}</TableCell>
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
  );
};

export default LeaveBalanceManagement;