import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchPayrollSettings, updatePayrollSettings, type PayrollSettings as PayrollSettingsType } from "@/lib/payroll/payroll-service";
import { Save, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";

export const PayrollSettings = () => {
  const [settings, setSettings] = useState<PayrollSettingsType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchPayrollSettings();
      setSettings(data);
    } catch (error) {
      toast.error("Failed to load payroll settings");
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setLoading(true);
    try {
      await updatePayrollSettings({ reference_pay_date: settings.reference_pay_date });
      toast.success("Reference pay date saved successfully");
    } catch (error) {
      toast.error("Failed to save payroll settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate current fortnight based on reference date
  const getCurrentFortnight = () => {
    if (!settings?.reference_pay_date) return null;
    
    const refDate = new Date(settings.reference_pay_date);
    const today = new Date();
    
    // Reference date is a Tuesday (pay day), fortnight starts on previous Monday
    const refMonday = addDays(refDate, -1); // Monday before reference Tuesday
    
    // Calculate days since reference Monday
    const daysDiff = Math.floor((today.getTime() - refMonday.getTime()) / (1000 * 60 * 60 * 24));
    
    // Find which fortnight we're in
    const fortnightNumber = Math.floor(daysDiff / 14);
    const fortnightStart = addDays(refMonday, fortnightNumber * 14);
    const fortnightEnd = addDays(fortnightStart, 13);
    const payDay = addDays(fortnightStart, 1); // Tuesday
    
    return {
      start: fortnightStart,
      end: fortnightEnd,
      payDay: payDay
    };
  };

  const currentFortnight = getCurrentFortnight();

  if (!settings) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Reference Pay Date
          </CardTitle>
          <CardDescription>
            Set a known Tuesday pay date to anchor the fortnightly pay cycle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="reference_pay_date">Reference Pay Date (Tuesday)</Label>
            <Input
              id="reference_pay_date"
              type="date"
              value={settings.reference_pay_date}
              onChange={(e) => setSettings({ ...settings, reference_pay_date: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Choose any Tuesday when payroll was or will be processed
            </p>
          </div>

          <Button onClick={handleSave} disabled={loading} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Reference Date"}
          </Button>
        </CardContent>
      </Card>

      {currentFortnight && (
        <Card>
          <CardHeader>
            <CardTitle>Current Pay Period</CardTitle>
            <CardDescription>
              Calculated from your reference pay date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Period Start</p>
                <p className="text-lg font-semibold">{format(currentFortnight.start, "EEE, MMM d, yyyy")}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Period End</p>
                <p className="text-lg font-semibold">{format(currentFortnight.end, "EEE, MMM d, yyyy")}</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Pay Day</p>
                <p className="text-lg font-semibold text-primary">{format(currentFortnight.payDay, "EEE, MMM d, yyyy")}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Leave entries after Tuesday will be flagged in the Timesheet Report for next period processing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};