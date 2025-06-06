
import React from "react";
import { Button } from "@/components/ui/button";
import { isValidDateRange, DateRange } from "@/lib/date-range-utils";

interface ActionButtonsProps {
  tempRange: DateRange;
  onApply: (close: () => void) => void;
  onCancel: (close: () => void) => void;
  close: () => void;
  isMobile?: boolean;
}

export const ActionButtons = ({ tempRange, onApply, onCancel, close, isMobile = false }: ActionButtonsProps) => {
  return (
    <div className={cn(
      isMobile ? "flex gap-3" : "mt-6 pt-4 border-t border-gray-200 space-y-2"
    )}>
      <Button
        type="button"
        onClick={() => onApply(close)}
        className={cn(
          isMobile ? "flex-1 h-11" : "w-full"
        )}
        size={isMobile ? "default" : "sm"}
        disabled={!isValidDateRange(tempRange)}
      >
        Apply
      </Button>
      <Button
        type="button"
        onClick={() => onCancel(close)}
        variant="outline"
        className={cn(
          isMobile ? "flex-1 h-11" : "w-full"
        )}
        size={isMobile ? "default" : "sm"}
      >
        Cancel
      </Button>
    </div>
  );
};
