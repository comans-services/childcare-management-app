
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeZoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const TimeZoneSelect: React.FC<TimeZoneSelectProps> = ({ value, onChange, disabled }) => {
  const timeZones = Intl.supportedValuesOf("timeZone");
  
  // Group common time zones at the top for better UX
  const commonTimeZones = [
    "America/New_York",
    "America/Chicago", 
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney"
  ];
  
  const otherTimeZones = timeZones.filter(tz => !commonTimeZones.includes(tz));

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select time zone" />
      </SelectTrigger>
      <SelectContent>
        {commonTimeZones.map((tz) => (
          <SelectItem key={tz} value={tz}>
            {tz.replace(/_/g, ' ')}
          </SelectItem>
        ))}
        {otherTimeZones.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-t">
              Other Time Zones
            </div>
            {otherTimeZones.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
};

export default TimeZoneSelect;
