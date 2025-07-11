import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RefreshCw, Calendar, Settings, History } from "lucide-react";
import { BalanceOperationsService, BalanceOperation, AnnualResetResult } from "@/lib/leave/balance-operations-service";
import { fetchLeaveTypes, LeaveType } from "@/lib/leave-service";
import { useToast } from "@/hooks/use-toast";

const LeaveBalanceOperations = () => {
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [operations, setOperations] = useState<BalanceOperation[]>([]);
  const [resetPreview, setResetPreview] = useState<any[]>([]);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetYear, setResetYear] = useState(new Date().getFullYear() + 1);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");
  const [carryOverSettings, setCarryOverSettings] = useState({
    maxDays: 0,
    expiryMonths: 12
  });
  const { toast } = useToast();

  useEffect(() => {
    loadLeaveTypes();
    loadOperationsHistory();
  }, []);

  const loadLeaveTypes = async () => {
    try {
      const data = await fetchLeaveTypes();
      setLeaveTypes(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load leave types.",
        variant: "destructive",
      });
    }
  };

  const loadOperationsHistory = async () => {
    try {
      const data = await BalanceOperationsService.getOperationsHistory();
      setOperations(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load operations history.",
        variant: "destructive",
      });
    }
  };

  const handleGetResetPreview = async () => {
    setLoading(true);
    try {
      const preview = await BalanceOperationsService.getAnnualResetPreview(resetYear);
      setResetPreview(preview);
      setShowResetDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate reset preview.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnnualReset = async () => {
    setLoading(true);
    try {
      const results = await BalanceOperationsService.performAnnualReset(resetYear);
      toast({
        title: "Annual Reset Complete",
        description: `Successfully reset balances for ${results.length} leave balance records.`,
      });
      setShowResetDialog(false);
      loadOperationsHistory();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform annual reset.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCarryOverSettings = async () => {
    if (!selectedLeaveType) {
      toast({
        title: "Error",
        description: "Please select a leave type.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await BalanceOperationsService.updateCarryOverSettings(
        selectedLeaveType,
        carryOverSettings.maxDays,
        carryOverSettings.expiryMonths
      );
      toast({
        title: "Settings Updated",
        description: "Carry-over settings have been updated successfully.",
      });
      loadLeaveTypes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update carry-over settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatOperationType = (type: string) => {
    switch (type) {
      case 'annual_reset': return 'Annual Reset';
      case 'carry_over': return 'Carry Over';
      case 'manual_adjustment': return 'Manual Adjustment';
      default: return type;
    }
  };

  const getOperationBadgeVariant = (type: string) => {
    switch (type) {
      case 'annual_reset': return 'default';
      case 'carry_over': return 'secondary';
      case 'manual_adjustment': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="annual-reset" className="space-y-6">
        <TabsList>
          <TabsTrigger value="annual-reset" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Annual Reset
          </TabsTrigger>
          <TabsTrigger value="carry-over" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Carry-over Settings
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Operations History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="annual-reset" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Annual Leave Balance Reset</CardTitle>
              <p className="text-muted-foreground">
                Reset all employee leave balances for the new year with automatic carry-over calculation.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reset-year">Reset Year</Label>
                  <Input
                    id="reset-year"
                    type="number"
                    value={resetYear}
                    onChange={(e) => setResetYear(parseInt(e.target.value))}
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 5}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleGetResetPreview}
                  disabled={loading}
                  variant="outline"
                >
                  {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Preview Reset
                </Button>
              </div>

              {resetPreview.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Reset Preview for {resetYear}</h4>
                  <div className="text-sm text-muted-foreground mb-3">
                    This will affect {resetPreview.length} balance records.
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Leave Type</TableHead>
                          <TableHead>Current Remaining</TableHead>
                          <TableHead>Carry Over</TableHead>
                          <TableHead>New Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resetPreview.slice(0, 10).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.user_name}</TableCell>
                            <TableCell>{item.leave_type_name}</TableCell>
                            <TableCell>{item.current_remaining}</TableCell>
                            <TableCell>{item.carry_over_days}</TableCell>
                            <TableCell>{item.new_total}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {resetPreview.length > 10 && (
                      <div className="text-center text-sm text-muted-foreground mt-2">
                        And {resetPreview.length - 10} more records...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carry-over" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Carry-over Settings</CardTitle>
              <p className="text-muted-foreground">
                Configure carry-over rules for each leave type.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="leave-type">Leave Type</Label>
                  <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="max-days">Max Carry-over Days</Label>
                  <Input
                    id="max-days"
                    type="number"
                    value={carryOverSettings.maxDays}
                    onChange={(e) => setCarryOverSettings(prev => ({
                      ...prev,
                      maxDays: parseInt(e.target.value) || 0
                    }))}
                    min={0}
                    max={365}
                  />
                </div>

                <div>
                  <Label htmlFor="expiry-months">Expiry (Months)</Label>
                  <Input
                    id="expiry-months"
                    type="number"
                    value={carryOverSettings.expiryMonths}
                    onChange={(e) => setCarryOverSettings(prev => ({
                      ...prev,
                      expiryMonths: parseInt(e.target.value) || 0
                    }))}
                    min={1}
                    max={24}
                  />
                </div>
              </div>

              <Button 
                onClick={handleUpdateCarryOverSettings}
                disabled={loading || !selectedLeaveType}
              >
                {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Update Settings
              </Button>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Current Settings</h4>
                <div className="space-y-2">
                  {leaveTypes.map((type) => (
                    <div key={type.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="font-medium">{type.name}</span>
                      <div className="text-sm text-muted-foreground">
                        Max: {type.max_carry_over_days || 0} days, 
                        Expires: {type.carry_over_expiry_months || 12} months
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Operations History</CardTitle>
              <p className="text-muted-foreground">
                View all balance operations including resets, carry-overs, and manual adjustments.
              </p>
            </CardHeader>
            <CardContent>
              {operations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No operations found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations.map((operation) => (
                      <TableRow key={operation.id}>
                        <TableCell>
                          {new Date(operation.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getOperationBadgeVariant(operation.operation_type)}>
                            {formatOperationType(operation.operation_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {operation.user?.full_name || operation.user?.email}
                        </TableCell>
                        <TableCell>{operation.leave_type?.name}</TableCell>
                        <TableCell>{operation.amount}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {operation.reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Annual Reset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to perform the annual reset for {resetYear}? 
              This will update {resetPreview.length} balance records and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAnnualReset} disabled={loading}>
              {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LeaveBalanceOperations;