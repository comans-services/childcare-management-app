
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddEntryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  isWeekendLocked?: boolean;
}

const AddEntryButton: React.FC<AddEntryButtonProps> = ({ 
  onClick, 
  disabled = false,
  className,
  isWeekendLocked = false
}) => {
  const isDisabled = disabled || isWeekendLocked;
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "w-full border-dashed hover:bg-primary/5 hover:border-primary/30 transition-colors",
        "flex items-center justify-center gap-2 text-muted-foreground hover:text-primary",
        isDisabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:border-dashed hover:text-muted-foreground",
        isWeekendLocked && "border-amber-300 bg-amber-50",
        className
      )}
    >
      {isWeekendLocked ? (
        <>
          <Lock className="h-3 w-3" />
          Weekend Locked
        </>
      ) : (
        <>
          <Plus className="h-3 w-3" />
          Add Time
        </>
      )}
    </Button>
  );
};

export default AddEntryButton;
