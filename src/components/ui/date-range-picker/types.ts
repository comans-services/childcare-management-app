
import { DateRangeType } from "@/lib/date-range-utils";

export interface DateRangePickerProps {
  value: { from?: Date; to?: Date };
  onChange: (range: { from?: Date; to?: Date }) => void;
  disabled?: boolean;
  className?: string;
}

export interface DateRangePickerState {
  tempRange: { from?: Date; to?: Date };
  selectedPreset: string | null;
  currentMonth: Date;
}
