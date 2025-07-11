import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeaveBalanceManagementService } from "@/lib/leave/balance-management-service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Settings, TrendingUp, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface BalanceAdjustmentFormData {
  userId: string;
  leaveTypeId: string;
  year: number;
  adjustmentType: 'increase' | 'decrease' | 'set';
  amount: number;
  reason: string;
}

const BalanceManagementInterface: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<BalanceAdjustmentFormData>({
    userId: '',
    leaveTypeId: '',
    year: selectedYear,
    adjustmentType: 'increase',
    amount: 0,
    reason: ''
  });

  const { data: balances, isLoading, refetch } = useQuery({
    queryKey: ['leave-balances', selectedYear],
    queryFn: () => LeaveBalanceManagementService.getAllUserBalances(selectedYear),
  });

  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  const handleAdjustmentSubmit = async () => {
    try {
      await LeaveBalanceManagementService.adjustBalance(adjustmentForm);
      toast({
        title: "Balance Adjusted",
        description: "Leave balance has been successfully adjusted.",
      });
      setIsAdjustmentDialogOpen(false);
      setAdjustmentForm({
        userId: '',
        leaveTypeId: '',
        year: selectedYear,
        adjustmentType: 'increase',
        amount: 0,
        reason: ''
      });
      refetch();
    } catch (error) {
      console.error('Failed to adjust balance:', error);
      toast({
        title: "Error",
        description: "Failed to adjust leave balance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInitializeYear = async () => {
    try {
      const count = await LeaveBalanceManagementService.initializeYearBalances(selectedYear);
      toast({
        title: "Year Initialized",
        description: `Created ${count} new balance records for ${selectedYear}.`,
      });
      refetch();
    } catch (error) {
      console.error('Failed to initialize year:', error);
      toast({
        title: "Error",
        description: "Failed to initialize year balances. Please try again.",
        variant: "destructive",
      });
    }
  };

  const groupedBalances = balances?.reduce((acc, balance) => {
    const key = `${balance.user_id}-${balance.profiles?.full_name}`;
    if (!acc[key]) {
      acc[key] = {
        user: balance.profiles,
        balances: []
      };
    }
    acc[key].balances.push(balance);
    return acc;
  }, {} as Record<string, { user: any; balances: any[] }>);

  if (isLoading) {
    return <div className="p-4">Loading leave balances...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Leave Balance Management</h2>
          <p className="text-muted-foreground">
            Manage team leave balances and adjustments
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleInitializeYear} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Initialize Year
          </Button>
          <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adjust Balance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adjust Leave Balance</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user">Employee</Label>
                  <Select value={adjustmentForm.userId} onValueChange={(value) => 
                    setAdjustmentForm(prev => ({ ...prev, userId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select value={adjustmentForm.leaveTypeId} onValueChange={(value) => 
                    setAdjustmentForm(prev => ({ ...prev, leaveTypeId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes?.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="adjustmentType">Adjustment Type</Label>
                  <Select value={adjustmentForm.adjustmentType} onValueChange={(value: any) => 
                    setAdjustmentForm(prev => ({ ...prev, adjustmentType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase">Increase</SelectItem>
                      <SelectItem value="decrease">Decrease</SelectItem>
                      <SelectItem value="set">Set Total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount (days)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.5"
                    value={adjustmentForm.amount}
                    onChange={(e) => setAdjustmentForm(prev => ({ 
                      ...prev, 
                      amount: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain the reason for this adjustment..."
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm(prev => ({ 
                      ...prev, 
                      reason: e.target.value 
                    }))}
                  />
                </div>

                <Button 
                  onClick={handleAdjustmentSubmit} 
                  className="w-full"
                  disabled={!adjustmentForm.userId || !adjustmentForm.leaveTypeId || !adjustmentForm.reason}
                >
                  Apply Adjustment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Leave Balances - {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {groupedBalances && Object.keys(groupedBalances).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Employment Type</TableHead>
                  <TableHead>Annual Leave</TableHead>
                  <TableHead>Sick Leave</TableHead>
                  <TableHead>Personal Leave</TableHead>
                  <TableHead>Other Leave Types</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedBalances).map(([key, group]) => {
                  const { user, balances } = group;
                  const annualLeave = balances.find(b => b.leave_types?.name === 'Annual Leave');
                  const sickLeave = balances.find(b => b.leave_types?.name === 'Sick Leave');
                  const personalLeave = balances.find(b => b.leave_types?.name === 'Personal Leave');
                  const otherLeaves = balances.filter(b => 
                    !['Annual Leave', 'Sick Leave', 'Personal Leave'].includes(b.leave_types?.name)
                  );

                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{user?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user?.employment_type?.replace('-', ' ') || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {annualLeave ? (
                          <div className="text-sm">
                            <div>{annualLeave.remaining_days || (annualLeave.total_days - annualLeave.used_days)} / {annualLeave.total_days} days</div>
                            <div className="text-muted-foreground">Used: {annualLeave.used_days}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No balance</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sickLeave ? (
                          <div className="text-sm">
                            <div>{sickLeave.remaining_days || (sickLeave.total_days - sickLeave.used_days)} / {sickLeave.total_days} days</div>
                            <div className="text-muted-foreground">Used: {sickLeave.used_days}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No balance</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {personalLeave ? (
                          <div className="text-sm">
                            <div>{personalLeave.remaining_days || (personalLeave.total_days - personalLeave.used_days)} / {personalLeave.total_days} days</div>
                            <div className="text-muted-foreground">Used: {personalLeave.used_days}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No balance</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {otherLeaves.length > 0 ? (
                          <div className="space-y-1">
                            {otherLeaves.map(leave => (
                              <div key={leave.id} className="text-sm">
                                <span className="font-medium">{leave.leave_types?.name}:</span> {
                                  leave.remaining_days || (leave.total_days - leave.used_days)
                                } / {leave.total_days}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No leave balances found for {selectedYear}. Click "Initialize Year" to create default balances.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceManagementInterface;