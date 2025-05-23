
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AddEntryButtonProps {
  onClick: () => void;
}

const AddEntryButton: React.FC<AddEntryButtonProps> = ({ onClick }) => {
  return (
    <div className="text-center py-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
              onClick={onClick}
              aria-label="Add new time entry"
            >
              <Plus className="mr-1 h-3 w-3" /> Add Entry
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add a new time entry for this day</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default AddEntryButton;
