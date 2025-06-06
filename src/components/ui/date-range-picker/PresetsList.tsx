
import React from "react";
import { cn } from "@/lib/utils";
import { dateRangePresets } from "@/lib/date-range-utils";

interface PresetsListProps {
  selectedPreset: string | null;
  onPresetClick: (preset: any) => void;
}

export const PresetsList = ({ selectedPreset, onPresetClick }: PresetsListProps) => {
  return (
    <div className="space-y-1">
      {dateRangePresets.map((preset) => (
        <button
          key={preset.value}
          type="button"
          onClick={() => onPresetClick(preset)}
          className={cn(
            "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
            selectedPreset === preset.value
              ? "bg-blue-100 text-blue-900"
              : "hover:bg-gray-100 text-gray-700"
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
};
