import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingDown, Briefcase } from "lucide-react";
import { LeaveBalance, fetchUserLeaveBalances } from "@/lib/leave-service";
import { useToast } from "@/hooks/use-toast";
import { useEmploymentType } from "@/hooks/useEmploymentType";

interface LeaveBalanceDisplayProps {
  userId?: string;
}

const LeaveBalanceDisplay = ({ userId }: LeaveBalanceDisplayProps) => {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isFullTime } = useEmploymentType();

  useEffect(() => {
    const loadLeaveBalances = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const data = await fetchUserLeaveBalances(userId);
        setLeaveBalances(data);
      } catch (error) {
        console.error("Error loading leave balances:", error);
        toast({
          title: "Error",
          description: "Failed to load leave balances. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadLeaveBalances();
  }, [userId, toast]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-2 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Show part-time employee message if not full-time
  if (!isFullTime) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">Leave Balances Not Available</h3>
            <p className="text-muted-foreground">
              Leave balances are only available for full-time employees.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leaveBalances.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">No Leave Balances Found</h3>
            <p className="text-muted-foreground">
              No leave balances have been set up for your account yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getBalanceStatus = (balance: LeaveBalance) => {
    const usagePercentage = (balance.used_days / balance.total_days) * 100;
    if (usagePercentage >= 90) return { color: "destructive", text: "Critical" };
    if (usagePercentage >= 70) return { color: "warning", text: "Low" };
    if (usagePercentage >= 50) return { color: "secondary", text: "Moderate" };
    return { color: "default", text: "Good" };
  };

  const getProgressColor = (usagePercentage: number) => {
    if (usagePercentage >= 90) return "bg-destructive";
    if (usagePercentage >= 70) return "bg-orange-500";
    if (usagePercentage >= 50) return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leaveBalances.map((balance) => {
          const usagePercentage = balance.total_days > 0 
            ? (balance.used_days / balance.total_days) * 100 
            : 0;
          const status = getBalanceStatus(balance);

          return (
            <Card key={balance.id} className="relative">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {balance.leave_type?.name}
                  </CardTitle>
                  <Badge variant={status.color as any}>
                    {status.text}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-3xl font-bold text-primary">
                    {balance.remaining_days}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    days remaining
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usage</span>
                    <span>{Math.round(usagePercentage)}%</span>
                  </div>
                  <Progress 
                    value={usagePercentage} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Used: {balance.used_days}</span>
                    <span>Total: {balance.total_days}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span>Used Days</span>
                  </div>
                  <span className="font-medium">{balance.used_days}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Year</span>
                  </div>
                  <span className="font-medium">{balance.year}</span>
                </div>

                {balance.leave_type?.description && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    {balance.leave_type.description}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Leave Summary for {new Date().getFullYear()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {leaveBalances.reduce((sum, balance) => sum + balance.total_days, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {leaveBalances.reduce((sum, balance) => sum + balance.used_days, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Used Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {leaveBalances.reduce((sum, balance) => sum + balance.remaining_days, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Remaining Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {leaveBalances.length}
              </div>
              <div className="text-sm text-muted-foreground">Leave Types</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveBalanceDisplay;