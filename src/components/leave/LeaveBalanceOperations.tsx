import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, RefreshCw, AlertCircle } from "lucide-react";

const adjustmentSchema = z.object({
  user_id: z.string().min(1, "Please select a user"),
  leave_type_id: z.string().min(1, "Please select a leave type"),
  adjustment: z.number().min(-365, "Adjustment too large").max(365, "Adjustment too large"),
  reason: z.string().min(10, "Please provide a detailed reason (minimum 10 characters)"),
});

interface User {
  id: string;
  full_name: string;
  employment_type: string;
}

interface LeaveType {
  id: string;
  name: string;
}

export const LeaveBalanceOperations = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [carryOverYear, setCarryOverYear] = useState(new Date().getFullYear() - 1);
  const [newBalanceYear, setNewBalanceYear] = useState(new Date().getFullYear());

  const form = useForm<z.infer<typeof adjustmentSchema>>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      adjustment: 0,
      reason: "",
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch full-time users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, full_name, employment_type")
        .eq("employment_type", "full-time")
        .eq("is_active", true)
        .order("full_name");

      if (usersError) throw usersError;

      // Fetch leave types
      const { data: typesData, error: typesError } = await supabase
        .from("leave_types")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (typesError) throw typesError;

      setUsers(usersData || []);
      setLeaveTypes(typesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load users and leave types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCarryOver = async () => {
    try {
      setProcessing(true);

      const { data, error } = await supabase.rpc("process_leave_carry_over", {
        p_from_year: carryOverYear,
        p_to_year: carryOverYear + 1,
      });

      if (error) throw error;

      const carriedOverCount = data?.length || 0;

      toast({
        title: "Carry-Over Complete",
        description: `Successfully processed carry-over for ${carriedOverCount} balance(s) from ${carryOverYear} to ${carryOverYear + 1}`,
      });

      // Log the details
      console.log("Carry-over results:", data);
    } catch (error: any) {
      console.error("Error processing carry-over:", error);
      toast({
        title: "Carry-Over Failed",
        description: error.message || "Failed to process year-end carry-over",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleInitializeNewYear = async () => {
    try {
      setProcessing(true);

      // Initialize balances for all full-time users for the new year
      const initPromises = users.map((user) =>
        supabase.rpc("initialize_user_leave_balances", {
          p_user_id: user.id,
          p_year: newBalanceYear,
        })
      );

      await Promise.all(initPromises);

      toast({
        title: "Initialization Complete",
        description: `Successfully initialized leave balances for ${users.length} employees for ${newBalanceYear}`,
      });
    } catch (error: any) {
      console.error("Error initializing balances:", error);
      toast({
        title: "Initialization Failed",
        description: error.message || "Failed to initialize new year balances",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualAdjustment = async (values: z.infer<typeof adjustmentSchema>) => {
    try {
      setProcessing(true);

      const currentYear = new Date().getFullYear();

      // Get current balance
      const { data: currentBalance, error: fetchError } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("user_id", values.user_id)
        .eq("leave_type_id", values.leave_type_id)
        .eq("year", currentYear)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new total
      const newTotal = currentBalance.total_days + values.adjustment;

      if (newTotal < 0) {
        throw new Error("Adjustment would result in negative balance");
      }

      // Update balance
      const { error: updateError } = await supabase
        .from("leave_balances")
        .update({ total_days: newTotal })
        .eq("id", currentBalance.id);

      if (updateError) throw updateError;

      // Log the adjustment in audit_logs
      const userName = users.find((u) => u.id === values.user_id)?.full_name;
      const leaveTypeName = leaveTypes.find((lt) => lt.id === values.leave_type_id)?.name;

      await supabase.from("audit_logs").insert({
        action: "leave_balance_manual_adjustment",
        details: {
          user_id: values.user_id,
          user_name: userName,
          leave_type: leaveTypeName,
          old_balance: currentBalance.total_days,
          new_balance: newTotal,
          adjustment: values.adjustment,
          reason: values.reason,
          year: currentYear,
        },
      });

      toast({
        title: "Adjustment Applied",
        description: `Balance adjusted from ${currentBalance.total_days} to ${newTotal} days for ${userName}`,
      });

      form.reset();
    } catch (error: any) {
      console.error("Error applying adjustment:", error);
      toast({
        title: "Adjustment Failed",
        description: error.message || "Failed to apply balance adjustment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Annual Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Annual Operations
          </CardTitle>
          <CardDescription>
            Perform year-end carry-over and initialize balances for new years
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Carry-Over Section */}
          <div className="space-y-4">
            <div>
              <Label>Year-End Carry-Over</Label>
              <p className="text-sm text-muted-foreground">
                Transfer unused leave from one year to the next (respects max carry-over limits)
              </p>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="carryOverYear">From Year</Label>
                <Input
                  id="carryOverYear"
                  type="number"
                  value={carryOverYear}
                  onChange={(e) => setCarryOverYear(parseInt(e.target.value))}
                  min={2020}
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="flex-1">
                <Label>To Year</Label>
                <Input value={carryOverYear + 1} disabled />
              </div>
              <Button
                onClick={handleCarryOver}
                disabled={processing}
                className="min-w-[200px]"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Process Carry-Over
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="space-y-4">
              <div>
                <Label>Initialize New Year Balances</Label>
                <p className="text-sm text-muted-foreground">
                  Create default leave balances for all full-time employees for a new year
                </p>
              </div>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="newBalanceYear">Year</Label>
                  <Input
                    id="newBalanceYear"
                    type="number"
                    value={newBalanceYear}
                    onChange={(e) => setNewBalanceYear(parseInt(e.target.value))}
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 5}
                  />
                </div>
                <Button
                  onClick={handleInitializeNewYear}
                  disabled={processing}
                  className="min-w-[200px]"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Initialize {newBalanceYear}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Adjustments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Manual Balance Adjustments
          </CardTitle>
          <CardDescription>
            Manually adjust leave balances for individual employees (requires detailed reason)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              All manual adjustments are logged in the audit trail with your user ID and timestamp.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleManualAdjustment)} className="space-y-6">
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leave_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adjustment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., +5 or -3"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a positive number to add days, negative to subtract
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Adjustment</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a detailed reason for this adjustment..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This reason will be recorded in the audit log
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={processing} className="w-full">
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying Adjustment...
                  </>
                ) : (
                  "Apply Adjustment"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveBalanceOperations;
