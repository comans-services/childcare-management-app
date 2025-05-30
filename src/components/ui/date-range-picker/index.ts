
// Legacy exports for backward compatibility
export { DateRangePicker as LegacyDateRangePicker } from "./DateRangePicker";
export type { DateRangePickerProps as LegacyDateRangePickerProps, DateRangePickerState } from "./types";

// Re-export the new DateRangePicker
export { DateRangePicker, type DateRange, type DateRangePickerProps } from "../DateRangePicker";
