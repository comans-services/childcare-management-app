import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateDisplay } from "@/lib/date-utils";

interface LeaveReportsSectionProps {
  leaveData: any;
  isLoading?: boolean;
}

export const LeaveReportsSection: React.FC<LeaveReportsSectionProps> = ({
  leaveData,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Reports</CardTitle>
          <CardDescription>Loading leave data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaveData || !leaveData.applications || leaveData.applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Reports</CardTitle>
          <CardDescription>No leave applications found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground">
              No leave applications found for the selected filters.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-600">Rejected</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Leave Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Applications</CardTitle>
          <CardDescription>
            Showing {leaveData.applications.length} leave applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveData.applications.map((app: any) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      {app.profiles?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>{app.leave_types?.name || "Unknown"}</TableCell>
                    <TableCell>{formatDateDisplay(new Date(app.start_date))}</TableCell>
                    <TableCell>{formatDateDisplay(new Date(app.end_date))}</TableCell>
                    <TableCell>{app.business_days_count}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="max-w-xs truncate">{app.reason || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balances */}
      {leaveData.balances && leaveData.balances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Balances</CardTitle>
            <CardDescription>Current year leave balance summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Total Days</TableHead>
                    <TableHead>Used Days</TableHead>
                    <TableHead>Remaining Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveData.balances.map((balance: any) => (
                    <TableRow key={balance.id}>
                      <TableCell className="font-medium">
                        {balance.profiles?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>{balance.leave_types?.name || "Unknown"}</TableCell>
                      <TableCell>{balance.total_days}</TableCell>
                      <TableCell>{balance.used_days}</TableCell>
                      <TableCell>
                        <span
                          className={
                            balance.remaining_days < 5
                              ? "text-red-600 font-semibold"
                              : "text-foreground"
                          }
                        >
                          {balance.remaining_days}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeaveReportsSection;
