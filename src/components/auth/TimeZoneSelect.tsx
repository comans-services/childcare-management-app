// src/components/auth/TimeZoneSelect.tsx
import React from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

/* Static list – avoids the TS compile error */
const COMMON_TZ = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Pacific/Auckland",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/Los_Angeles",
  "America/New_York",
  "UTC"
];

const TimeZoneSelect: React.FC<Props> = ({ value, onChange }) => (
  <select
    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    required
  >
    {COMMON_TZ.map((z) => (
      <option key={z} value={z}>
        {z}
      </option>
    ))}
  </select>
);

export default TimeZoneSelect;
