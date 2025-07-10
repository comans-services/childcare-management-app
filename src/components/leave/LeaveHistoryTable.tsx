import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Search, Eye, Calendar, X } from "lucide-react";
import { LeaveApplication, fetchLeaveApplications, cancelLeaveApplication } from "@/lib/leave-service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface LeaveHistoryTableProps {
  userId?: string;
}

const LeaveHistoryTable = ({ userId }: LeaveHistoryTableProps) => {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const { toast } = useToast();
  const { userRole } = useAuth();

  const isAdmin = userRole === "admin";

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      try {
        const data = await fetchLeaveApplications(userId);
        setApplications(data);
        setFilteredApplications(data);
      } catch (error) {
        console.error("Error loading leave applications:", error);
        toast({
          title: "Error",
          description: "Failed to load leave applications. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [userId, toast]);

  useEffect(() => {
    let filtered = applications;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.leave_type?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.user_full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      cancelled: "outline",
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  const handleCancelApplication = async (applicationId: string) => {
    try {
      await cancelLeaveApplication(applicationId);
      toast({
        title: "Application Cancelled",
        description: "Your leave application has been cancelled successfully.",
      });
      
      // Refresh applications
      const data = await fetchLeaveApplications(userId);
      setApplications(data);
    } catch (error) {
      console.error("Error cancelling application:", error);
      toast({
        title: "Error",
        description: "Failed to cancel leave application. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Leave Applications Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "No applications match your current filters."
                  : "No leave applications have been submitted yet."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead>Employee</TableHead>}
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">
                      {application.leave_type?.name}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(application.start_date), "MMM dd, yyyy")}</div>
                        <div className="text-muted-foreground">
                          to {format(new Date(application.end_date), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{application.business_days_count}</TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{application.user_full_name}</div>
                          <div className="text-muted-foreground">{application.user_email}</div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      {format(new Date(application.submitted_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Leave Application Details</DialogTitle>
                              <DialogDescription>
                                Application submitted on{" "}
                                {format(new Date(application.submitted_at), "PPP")}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedApplication && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Leave Type</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedApplication.leave_type?.name}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <div className="mt-1">
                                      {getStatusBadge(selectedApplication.status)}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Start Date</label>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(selectedApplication.start_date), "PPP")}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">End Date</label>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(selectedApplication.end_date), "PPP")}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Business Days</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedApplication.business_days_count}
                                    </p>
                                  </div>
                                  {isAdmin && (
                                    <div>
                                      <label className="text-sm font-medium">Employee</label>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedApplication.user_full_name}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {selectedApplication.reason && (
                                  <div>
                                    <label className="text-sm font-medium">Reason</label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {selectedApplication.reason}
                                    </p>
                                  </div>
                                )}
                                {selectedApplication.manager_comments && (
                                  <div>
                                    <label className="text-sm font-medium">Manager Comments</label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {selectedApplication.manager_comments}
                                    </p>
                                  </div>
                                )}
                                {selectedApplication.approved_at && (
                                  <div>
                                    <label className="text-sm font-medium">
                                      {selectedApplication.status === "approved" ? "Approved" : "Processed"}
                                    </label>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(selectedApplication.approved_at), "PPP")} by{" "}
                                      {selectedApplication.approved_by_name}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {application.status === "pending" && !isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelApplication(application.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveHistoryTable;