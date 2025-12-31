import React from "react";
import { format } from "date-fns";
import { Clock, Calendar, User, FileText, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface ReportEntry {
  id: string;
  user_name?: string;
  entry_date: string;
  hours_logged: number;
  project?: string;
  notes?: string;
  start_time?: string;
  end_time?: string;
  [key: string]: any;
}

export interface ReportCardProps {
  entry: ReportEntry;
  showUser?: boolean;
  onTap?: (entry: ReportEntry) => void;
}

export function ReportCard({ entry, showUser = true, onTap }: ReportCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleCardClick = () => {
    if (onTap) {
      onTap(entry);
    }
  };

  return (
    <Card className="mb-3 overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className="p-4"
          onClick={handleCardClick}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              {showUser && entry.user_name && (
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="font-semibold text-gray-900 truncate">
                    {entry.user_name}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  {format(new Date(entry.entry_date), 'MMM d, yyyy')}
                </span>
              </div>

              {entry.start_time && entry.end_time && (
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    {entry.start_time} - {entry.end_time}
                  </span>
                </div>
              )}
            </div>

            {/* Hours badge */}
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary px-3 py-1.5 text-base font-semibold flex-shrink-0"
            >
              {entry.hours_logged.toFixed(1)}h
            </Badge>
          </div>

          {/* Project */}
          {entry.project && (
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-700">
                {entry.project}
              </span>
            </div>
          )}

          {/* Collapsible details */}
          {entry.notes && (
            <CollapsibleTrigger className="w-full" asChild>
              <button
                className="flex items-center justify-between w-full text-left group"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <span className="text-sm text-primary font-medium">
                  {isOpen ? 'Hide' : 'Show'} details
                </span>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 text-primary transition-transform",
                    isOpen && "rotate-90"
                  )}
                />
              </button>
            </CollapsibleTrigger>
          )}

          <CollapsibleContent>
            {entry.notes && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600">{entry.notes}</p>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </Card>
  );
}
