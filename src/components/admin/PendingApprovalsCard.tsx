
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User, Calendar } from "lucide-react";
import { TimesheetEntry, fetchTimesheetEntries } from "@/lib/timesheet-service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";

const PendingApprovalsCard: React.FC = () => {
  const [pendingEntries, setPendingEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { userRole } = useAuth();

  // Only show this component to admins
  if (userRole !== 'admin') {
    return null;
  }

  const fetchPendingEntries = async () => {
    try {
      setLoading(true);
      // Fetch all entries from the last 30 days to find pending ones
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const entries = await fetchTimesheetEntries(startDate, endDate, { includeUserData: true });
      const pending = entries.filter(entry => entry.approval_status === 'pending');
      setPendingEntries(pending);
    } catch (error) {
      console.error("Error fetching pending entries:", error);
      toast({
        title: "Error",
        description: "Failed to load pending approvals.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingEntries();
  }, []);

  const handleApproval = async (entryId: string, action: 'approved' | 'rejected') => {
    if (!entryId) return;
    
    setProcessingIds(prev => new Set(prev).add(entryId));
    
    try {
      const { error } = await supabase
        .from('timesheet_entries')
        .update({
          approval_status: action,
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: `Entry ${action}`,
        description: `Weekend entry has been ${action}.`,
      });

      // Refresh the list
      await fetchPendingEntries();
    } catch (error) {
      console.error(`Error ${action} entry:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action.replace('ed', '')} entry.`,
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Weekend Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Weekend Approvals
          {pendingEntries.length > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {pendingEntries.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingEntries.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No pending weekend entries to approve.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-amber-50 border-amber-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {entry.user?.full_name || entry.user?.email || 'Unknown User'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(entry.entry_date), 'EEE, MMM d, yyyy')}</span>
                    <span>•</span>
                    <span className="font-semibold">{entry.hours_logged}h</span>
                  </div>
                  <div className="text-sm">
                    Project: {entry.project?.name || entry.contract?.name || 'Unknown'}
                  </div>
                  {entry.notes && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Notes: {entry.notes}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproval(entry.id!, 'approved')}
                    disabled={processingIds.has(entry.id!)}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproval(entry.id!, 'rejected')}
                    disabled={processingIds.has(entry.id!)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingApprovalsCard;
