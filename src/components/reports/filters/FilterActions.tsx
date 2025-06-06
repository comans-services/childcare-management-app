
import React from "react";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

interface FilterActionsProps {
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
}

export const FilterActions = ({
  isExpanded,
  setIsExpanded,
  onGenerateReport,
  isGeneratingReport
}: FilterActionsProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="whitespace-nowrap"
      >
        {isExpanded ? 'Less Filters' : 'More Filters'}
      </Button>
      <Button 
        onClick={onGenerateReport}
        size="sm"
        disabled={isGeneratingReport}
        className="whitespace-nowrap"
      >
        {isGeneratingReport ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Generate Report
          </>
        )}
      </Button>
    </div>
  );
};
