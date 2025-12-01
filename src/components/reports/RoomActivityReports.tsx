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
import { AlertTriangle } from "lucide-react";

interface RoomActivityReportsProps {
  roomData: any;
  isLoading?: boolean;
}

export const RoomActivityReports: React.FC<RoomActivityReportsProps> = ({
  roomData,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Room Activity Reports</CardTitle>
          <CardDescription>Loading room activity data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!roomData || !roomData.staffEntries || roomData.staffEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Room Activity Reports</CardTitle>
          <CardDescription>No room activity found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground">
              No room activity found for the selected filters.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const calculateDuration = (entered: string, exited: string | null) => {
    if (!exited) return "In room";
    const duration =
      (new Date(exited).getTime() - new Date(entered).getTime()) / 1000 / 60;
    return `${Math.floor(duration)} mins`;
  };

  return (
    <div className="space-y-6">
      {/* Compliance Violations */}
      {roomData.complianceViolations && roomData.complianceViolations.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Compliance Violations
            </CardTitle>
            <CardDescription>
              {roomData.complianceViolations.length} compliance violations detected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-red-200 bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Staff Count</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Performed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomData.complianceViolations.map((violation: any, index: number) => (
                    <TableRow key={violation.log_id || index}>
                      <TableCell className="font-medium">
                        {formatDateDisplay(new Date(violation.performed_at))}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(violation.performed_at).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell>{violation.room_name}</TableCell>
                      <TableCell className="max-w-md">{violation.description}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{violation.staff_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-600">{violation.required_staff}</Badge>
                      </TableCell>
                      <TableCell>{violation.performed_by_name || "System"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Room Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Room Entries</CardTitle>
          <CardDescription>
            Showing {roomData.staffEntries.length} room entry records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Entered</TableHead>
                  <TableHead>Exited</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Entry Method</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomData.staffEntries.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.profiles?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      Room {entry.childcare_rooms?.room_number} -{" "}
                      {entry.childcare_rooms?.name}
                    </TableCell>
                    <TableCell>
                      {formatDateDisplay(new Date(entry.entered_at))}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.entered_at).toLocaleTimeString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {entry.exited_at ? (
                        <>
                          {formatDateDisplay(new Date(entry.exited_at))}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.exited_at).toLocaleTimeString()}
                          </span>
                        </>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.duration_minutes
                        ? `${entry.duration_minutes} mins`
                        : calculateDuration(entry.entered_at, entry.exited_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.entry_method || "manual"}</Badge>
                    </TableCell>
                    <TableCell>
                      {entry.room_devices?.device_name || "Manual"}
                    </TableCell>
                    <TableCell>
                      {entry.exited_at ? (
                        <Badge variant="secondary">Completed</Badge>
                      ) : (
                        <Badge className="bg-green-600">In Room</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      {roomData.activityLogs && roomData.activityLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Room Activity Log</CardTitle>
            <CardDescription>
              Showing {roomData.activityLogs.length} activity log entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Activity Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Device</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomData.activityLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {formatDateDisplay(new Date(log.performed_at))}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.performed_at).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        Room {log.childcare_rooms?.room_number} -{" "}
                        {log.childcare_rooms?.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.activity_type === "staff_enter"
                              ? "default"
                              : log.activity_type === "staff_exit"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {log.activity_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">{log.description}</TableCell>
                      <TableCell>{log.performer?.full_name || "System"}</TableCell>
                      <TableCell>
                        {log.room_devices?.device_name || "Manual"}
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

export default RoomActivityReports;
