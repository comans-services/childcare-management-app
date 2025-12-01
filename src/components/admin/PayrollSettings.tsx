import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { fetchPayrollSettings, updatePayrollSettings, generatePayPeriods, type PayrollSettings as PayrollSettingsType } from "@/lib/payroll/payroll-service";
import { CalendarPlus, Save } from "lucide-react";

export const PayrollSettings = () => {
  const [settings, setSettings] = useState<PayrollSettingsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

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
      await updatePayrollSettings(settings);
      toast.success("Payroll settings saved successfully");
    } catch (error) {
      toast.error("Failed to save payroll settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePeriods = async () => {
    if (!settings?.reference_pay_date) {
      toast.error("Please set a reference pay date first");
      return;
    }

    setGenerating(true);
    try {
      const count = await generatePayPeriods(settings.reference_pay_date, 24);
      toast.success(`Generated ${count} pay periods successfully`);
    } catch (error) {
      toast.error("Failed to generate pay periods");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  if (!settings) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payroll Configuration</CardTitle>
          <CardDescription>
            Configure how payroll periods are calculated and managed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pay_frequency">Pay Frequency</Label>
              <Select
                value={settings.pay_frequency}
                onValueChange={(value) => setSettings({ ...settings, pay_frequency: value })}
              >
                <SelectTrigger id="pay_frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="fortnightly">Fortnightly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay_day">Payroll Day</Label>
              <Select
                value={settings.pay_day}
                onValueChange={(value) => setSettings({ ...settings, pay_day: value })}
              >
                <SelectTrigger id="pay_day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="tuesday">Tuesday</SelectItem>
                  <SelectItem value="wednesday">Wednesday</SelectItem>
                  <SelectItem value="thursday">Thursday</SelectItem>
                  <SelectItem value="friday">Friday</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">Day when payroll is processed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="week_start_day">Week Start Day</Label>
              <Select
                value={settings.week_start_day}
                onValueChange={(value) => setSettings({ ...settings, week_start_day: value })}
              >
                <SelectTrigger id="week_start_day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_pay_date">Reference Pay Date</Label>
              <Input
                id="reference_pay_date"
                type="date"
                value={settings.reference_pay_date}
                onChange={(e) => setSettings({ ...settings, reference_pay_date: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">A known past or future payroll date</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours_per_leave_day">Hours per Leave Day</Label>
              <Input
                id="hours_per_leave_day"
                type="number"
                step="0.5"
                value={settings.hours_per_leave_day}
                onChange={(e) => setSettings({ ...settings, hours_per_leave_day: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Pay Periods</CardTitle>
          <CardDescription>
            Generate future pay periods based on your configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGeneratePeriods} disabled={generating}>
            <CalendarPlus className="w-4 h-4 mr-2" />
            {generating ? "Generating..." : "Generate Next 24 Periods"}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            This will create the next 24 pay periods based on your reference pay date and frequency.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
