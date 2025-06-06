
import React from "react";
import { Popover } from "@headlessui/react";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateRangeDisplay, DateRange } from "@/lib/date-range-utils";
import { DateRangePickerProps } from "./types";
import { useDateRangePicker } from "./hooks/useDateRangePicker";
import { PresetsList } from "./PresetsList";
import { ActionButtons } from "./ActionButtons";
import { DualCalendar } from "./DualCalendar";
import { useIsMobile } from "@/hooks/use-mobile";

export const DateRangePicker = ({ 
  value, 
  onChange, 
  disabled = false,
  className 
}: DateRangePickerProps) => {
  const isMobile = useIsMobile();
  const {
    tempRange,
    selectedPreset,
    currentMonth,
    nextMonth,
    handlePresetClick,
    handleApply,
    handleCancel,
    handleDateClick,
    handleKeyDown,
    handlePreviousMonth,
    handleNextMonth,
  } = useDateRangePicker(value, onChange);

  return (
    <div className={cn("relative", className)}>
      <Popover>
        {({ open, close }) => (
          <>
            <Popover.Button
              disabled={disabled}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                disabled && "opacity-50 cursor-not-allowed",
                open && "ring-2 ring-blue-500 border-blue-500"
              )}
              onKeyDown={(e) => handleKeyDown(e, close)}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-gray-900 truncate">
                  {formatDateRangeDisplay(value)}
                </span>
              </div>
            </Popover.Button>

            <Popover.Panel 
              className={cn(
                "fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg",
                isMobile 
                  ? "inset-x-2 top-20 max-h-[calc(100vh-6rem)] overflow-y-auto" 
                  : "mt-2 w-auto"
              )}
              style={!isMobile ? { 
                position: 'fixed',
                transform: 'translateY(8px)',
                maxWidth: '90vw',
                maxHeight: '80vh'
              } : {}}
            >
              <div 
                className={cn(
                  isMobile ? "flex flex-col" : "flex",
                  "min-h-0"
                )} 
                onKeyDown={(e) => handleKeyDown(e, close)}
              >
                {/* Presets Section */}
                <div className={cn(
                  "border-gray-200 bg-gray-50",
                  isMobile 
                    ? "w-full p-4 border-b" 
                    : "w-48 p-4 border-r"
                )}>
                  <div className={cn(
                    isMobile ? "mb-4" : "mb-0"
                  )}>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Select</h3>
                    <div className={cn(
                      isMobile 
                        ? "grid grid-cols-2 gap-2" 
                        : "space-y-1"
                    )}>
                      <PresetsList
                        selectedPreset={selectedPreset}
                        onPresetClick={handlePresetClick}
                        isMobile={isMobile}
                      />
                    </div>
                  </div>
                  
                  {!isMobile && (
                    <ActionButtons
                      tempRange={tempRange}
                      onApply={handleApply}
                      onCancel={handleCancel}
                      close={close}
                    />
                  )}
                </div>

                {/* Calendar Section */}
                <div className={cn(
                  isMobile ? "flex-1 min-h-0" : ""
                )}>
                  <DualCalendar
                    tempRange={tempRange}
                    currentMonth={currentMonth}
                    nextMonth={nextMonth}
                    onDateSelect={handleDateClick}
                    onPreviousMonth={handlePreviousMonth}
                    onNextMonth={handleNextMonth}
                    isMobile={isMobile}
                  />
                </div>

                {/* Mobile Action Buttons */}
                {isMobile && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <ActionButtons
                      tempRange={tempRange}
                      onApply={handleApply}
                      onCancel={handleCancel}
                      close={close}
                      isMobile={isMobile}
                    />
                  </div>
                )}
              </div>
            </Popover.Panel>
          </>
        )}
      </Popover>
    </div>
  );
};
