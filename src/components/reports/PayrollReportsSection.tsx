import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { fetchPayPeriods, getPayrollReportData, type PayPeriod, type PayrollReportData } from "@/lib/payroll/payroll-service";
import { format } from "date-fns";

export const PayrollReportsSection = () => {
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [reportData, setReportData] = useState<PayrollReportData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPayPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadReportData();
    }
  }, [selectedPeriod]);

  const loadPayPeriods = async () => {
    try {
      const periods = await fetchPayPeriods(24);
      setPayPeriods(periods);
      if (periods.length > 0) {
        setSelectedPeriod(periods[0].id);
      }
    } catch (error) {
      toast.error("Failed to load pay periods");
      console.error(error);
    }
  };

  const loadReportData = async () => {
    if (!selectedPeriod) return;

    setLoading(true);
    try {
      const data = await getPayrollReportData(selectedPeriod);
      setReportData(data);
    } catch (error) {
      toast.error("Failed to load payroll report");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const selectedPeriodData = payPeriods.find(p => p.id === selectedPeriod);
    const headers = [
      "Employee Name",
      "Scheduled Hours",
      "Actual Hours",
      "Leave (Pre-Cutoff)",
      "Leave (Post-Cutoff)",
      "Prior Adjustments",
      "Net Hours"
    ];

    const rows = reportData.map(row => [
      row.full_name,
      row.scheduled_hours.toFixed(2),
      row.actual_hours.toFixed(2),
      row.leave_hours_pre_cutoff.toFixed(2),
      row.leave_hours_post_cutoff.toFixed(2),
      row.prior_period_adjustments.toFixed(2),
      row.net_hours.toFixed(2)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-report-${selectedPeriodData?.period_start || "report"}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Report exported successfully");
  };

  const selectedPeriodData = payPeriods.find(p => p.id === selectedPeriod);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payroll Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Pay Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pay period" />
                </SelectTrigger>
                <SelectContent>
                  {payPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {format(new Date(period.period_start), "MMM d, yyyy")} - {format(new Date(period.period_end), "MMM d, yyyy")}
                      {period.status === "processed" && " (Processed)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadReportData} disabled={loading || !selectedPeriod}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={handleExport} disabled={reportData.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {selectedPeriodData && (
            <div className="p-4 bg-muted rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Pay Period:</span>
                <span>{format(new Date(selectedPeriodData.period_start), "MMM d, yyyy")} - {format(new Date(selectedPeriodData.period_end), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Payroll Cutoff:</span>
                <span>{format(new Date(selectedPeriodData.payroll_cutoff_date), "EEE, MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Payroll Date:</span>
                <span>{format(new Date(selectedPeriodData.payroll_date), "EEE, MMM d, yyyy")}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee Hours Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading report data...</div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No data available for selected period</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Scheduled</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Leave (Pre)</TableHead>
                    <TableHead className="text-right">Leave (Post)</TableHead>
                    <TableHead className="text-right">Prior Adj.</TableHead>
                    <TableHead className="text-right font-semibold">Net Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row) => (
                    <TableRow key={row.user_id}>
                      <TableCell className="font-medium">{row.full_name}</TableCell>
                      <TableCell className="text-right">{row.scheduled_hours.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{row.actual_hours.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{row.leave_hours_pre_cutoff.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-amber-600">{row.leave_hours_post_cutoff.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-red-600">-{row.prior_period_adjustments.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">{row.net_hours.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
