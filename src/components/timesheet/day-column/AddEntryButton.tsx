
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { isWeekend } from "@/lib/date-utils";
import { useAuth } from "@/context/AuthContext";

interface AddEntryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  date?: Date;
}

const AddEntryButton: React.FC<AddEntryButtonProps> = ({ 
  onClick, 
  disabled = false,
  className,
  date
}) => {
  const { userRole } = useAuth();
  const isWeekendDate = date ? isWeekend(date) : false;
  const isAdmin = userRole === 'admin';
  const showWeekendIndicator = isWeekendDate && !isAdmin;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full border-dashed hover:bg-primary/5 hover:border-primary/30 transition-colors",
        "flex items-center justify-center gap-2 text-muted-foreground hover:text-primary",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:border-dashed hover:text-muted-foreground",
        showWeekendIndicator && "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
        className
      )}
    >
      {showWeekendIndicator ? <Lock className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
      {showWeekendIndicator ? "Add Weekend Time" : "Add Time"}
    </Button>
  );
};

export default AddEntryButton;
