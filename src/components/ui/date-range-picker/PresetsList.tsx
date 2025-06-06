
import React from "react";
import { cn } from "@/lib/utils";
import { dateRangePresets } from "@/lib/date-range-utils";

interface PresetsListProps {
  selectedPreset: string | null;
  onPresetClick: (preset: any) => void;
  isMobile?: boolean;
}

export const PresetsList = ({ selectedPreset, onPresetClick, isMobile = false }: PresetsListProps) => {
  return (
    <>
      {dateRangePresets.map((preset) => (
        <button
          key={preset.value}
          type="button"
          onClick={() => onPresetClick(preset)}
          className={cn(
            "text-left text-sm rounded-md transition-colors font-medium",
            isMobile 
              ? "px-3 py-3 w-full" 
              : "w-full px-3 py-2",
            selectedPreset === preset.value
              ? "bg-blue-100 text-blue-900"
              : "hover:bg-gray-100 text-gray-700"
          )}
        >
          {preset.label}
        </button>
      ))}
    </>
  );
};
