import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TimesheetEntry } from "@/lib/timesheet-service";
import { formatDateDisplay, isAfterTuesdayCutoff } from "@/lib/date-utils";
import { ReportFiltersType } from "@/pages/ReportsPage";
import { LEAVE_TYPE_ABBREVIATIONS } from "@/components/timesheet/time-entry/schema";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PayPeriodInfo {
  period_start: string;
  period_end: string;
  payroll_cutoff_date: string;
  payroll_date: string;
}

interface AdjustedLeaveRow {
  id: string;
  user_id: string;
  leave_date: string;
  hours_to_deduct: number;
  reason: string | null;
  user_full_name?: string;
}

interface ReportDataTableProps {
  reportData: TimesheetEntry[];
  filters: ReportFiltersType;
  isLoading?: boolean;
}

export const ReportDataTable: React.FC<ReportDataTableProps> = ({
  reportData = [],
  filters,
  isLoading
}) => {
  const [currentPayPeriod, setCurrentPayPeriod] = useState<PayPeriodInfo | null>(null);
  const [nextPayPeriod, setNextPayPeriod] = useState<PayPeriodInfo | null>(null);
  const [adjustedLeave, setAdjustedLeave] = useState<AdjustedLeaveRow[]>([]);

  useEffect(() => {
    const fetchPayPeriods = async () => {
      if (!filters.startDate || !filters.endDate) return;

      try {
        // Find pay period matching the report date range
        const { data: current } = await supabase
          .from("pay_periods")
          .select("period_start, period_end, payroll_cutoff_date, payroll_date")
          .lte("period_start", filters.startDate)
          .gte("period_end", filters.endDate)
          .limit(1)
          .single();

        if (current) {
          setCurrentPayPeriod(current);

          // Fetch the next pay period
          const { data: next } = await supabase
            .from("pay_periods")
            .select("period_start, period_end, payroll_cutoff_date, payroll_date")
            .gt("period_start", current.period_end)
            .order("period_start", { ascending: true })
            .limit(1)
            .single();

          if (next) {
            setNextPayPeriod(next);
          }
        }
      } catch (error) {
        console.error("Error fetching pay periods:", error);
      }
    };

    const fetchAdjustedLeave = async () => {
      if (!filters.startDate || !filters.endDate) return;
      try {
        const { data } = await supabase
          .from("leave_adjustments")
          .select(`
            id, user_id, leave_date, hours_to_deduct, reason,
            profiles:user_id (full_name)
          `)
          .gte("leave_date", format(filters.startDate, "yyyy-MM-dd"))
          .lte("leave_date", format(filters.endDate, "yyyy-MM-dd"))
          .order("leave_date", { ascending: true });

        if (data) {
          setAdjustedLeave(
            data.map((r: any) => ({
              ...r,
              user_full_name: r.profiles?.full_name || "Unknown",
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching adjusted leave:", error);
      }
    };

    fetchPayPeriods();
    fetchAdjustedLeave();
  }, [filters.startDate, filters.endDate]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timesheet Report Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading report data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!reportData || reportData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timesheet Report Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data found. Generate a report to see results.</p>
        </CardContent>
      </Card>
    );
  }

  const totalHours = reportData.reduce((sum, entry) => sum + entry.hours_logged, 0);

  // Determine if an entry is after the payroll cutoff
  const isEntryAfterCutoff = (entry: any): boolean => {
    if (!entry.leave_type) return false;
    const entryDate = new Date(entry.entry_date);
    
    if (currentPayPeriod) {
      // Use actual cutoff date from pay period
      const cutoffDate = new Date(currentPayPeriod.payroll_cutoff_date);
      return entryDate > cutoffDate;
    }
    
    // Fallback to day-of-week check
    return isAfterTuesdayCutoff(entryDate);
  };

  const postCutoffLeaveEntries = reportData.filter(isEntryAfterCutoff);

  const formatPeriodDate = (dateStr: string) => format(new Date(dateStr), "EEE, MMM d");
  const formatShortDate = (dateStr: string) => format(new Date(dateStr), "MMM d");

  return (
    <div className="space-y-4">
      {postCutoffLeaveEntries.length > 0 && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            {postCutoffLeaveEntries.length} leave {postCutoffLeaveEntries.length === 1 ? 'entry' : 'entries'} after cutoff
            {currentPayPeriod && ` (${formatPeriodDate(currentPayPeriod.payroll_cutoff_date)})`}
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            {currentPayPeriod ? (
              <>
                This pay run covers {formatShortDate(currentPayPeriod.period_start)} – {formatShortDate(currentPayPeriod.period_end)}, paid on {formatPeriodDate(currentPayPeriod.payroll_date)}.
                {' '}These entries (marked with ⚠️) fall after the cutoff and will be deducted in the next pay run
                {nextPayPeriod 
                  ? ` (${formatShortDate(nextPayPeriod.period_start)} – ${formatShortDate(nextPayPeriod.period_end)}).`
                  : '.'
                }
              </>
            ) : (
              <>These entries (marked with ⚠️) were recorded after Tuesday and will be processed in the next pay period.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Timesheet Report Data ({reportData.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead className="text-center">Lunch</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((entry: any) => {
                  const entryDate = new Date(entry.entry_date);
                  const isPostCutoff = isEntryAfterCutoff(entry);
                  
                  return (
                    <TableRow key={entry.id} className={isPostCutoff ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
                      <TableCell>{formatDateDisplay(entryDate)}</TableCell>
                      <TableCell>{entry.user_full_name || 'Unknown'}</TableCell>
                      <TableCell>{entry.profiles?.employee_id || '-'}</TableCell>
                      <TableCell>
                        {entry.leave_type ? (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${isPostCutoff ? 'border-amber-500 text-amber-700 dark:text-amber-300' : ''}`}
                          >
                            {LEAVE_TYPE_ABBREVIATIONS[entry.leave_type] || entry.leave_type}
                            {isPostCutoff && ' ⚠️'}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{entry.start_time}</TableCell>
                      <TableCell>{entry.end_time}</TableCell>
                      <TableCell className="text-center">
                        {entry.leave_type ? (
                          <span className="text-gray-400 text-xs">N/A</span>
                        ) : entry.lunch_break_taken ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto" title="No lunch break recorded" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate" title={entry.notes || ""}>
                        {entry.notes || ""}
                      </TableCell>
                      <TableCell className="text-right">{entry.hours_logged.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
                {adjustedLeave.map((adj) => (
                  <TableRow key={`adj-${adj.id}`} className="bg-purple-50/60 dark:bg-purple-950/10">
                    <TableCell>{adj.leave_date}</TableCell>
                    <TableCell>{adj.user_full_name}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs border-purple-400 text-purple-700 dark:text-purple-300">
                        Adj. Leave
                      </Badge>
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="text-center"><span className="text-gray-400 text-xs">N/A</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{adj.reason || ""}</TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      -{adj.hours_to_deduct.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="font-bold bg-muted/50">
                  <TableCell colSpan={8} className="text-right">Total Hours:</TableCell>
                  <TableCell className="text-right">{totalHours.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportDataTable;
