import React, { useState } from "react";
import { useDrag } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import { format } from "date-fns";
import { Edit2, Trash2, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

export interface TimesheetEntry {
  id: string;
  entry_date: string;
  start_time: string;
  end_time: string;
  hours_logged: number;
  notes?: string;
  project?: string;
}

export interface MobileEntryCardProps {
  entry: TimesheetEntry;
  onEdit: (entry: TimesheetEntry) => void;
  onDelete: (entry: TimesheetEntry) => void;
}

export function MobileEntryCard({ entry, onEdit, onDelete }: MobileEntryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const bind = useDrag(
    ({ active, movement: [mx], direction: [dx], cancel, velocity: [vx] }) => {
      // Only allow horizontal swipes
      if (active && Math.abs(mx) > 10) {
        // Swipe left to delete (negative x)
        if (mx < -150) {
          cancel();
          setIsDeleting(true);
          haptics.medium();
          api.start({ x: -300 });
          setTimeout(() => onDelete(entry), 200);
          return;
        }
        // Swipe right to edit (positive x)
        if (mx > 150) {
          cancel();
          haptics.light();
          onEdit(entry);
          api.start({ x: 0 });
          return;
        }
        // Follow finger
        api.start({ x: mx, immediate: true });
      } else {
        // Snap back when released
        api.start({ x: 0 });
      }
    },
    { axis: 'x' }
  );

  return (
    <div className="relative overflow-hidden bg-white rounded-lg my-2">
      {/* Action backgrounds revealed on swipe */}
      <div className="absolute inset-0 flex">
        {/* Edit action (left side - revealed by swiping right) */}
        <div className="w-20 bg-blue-500 flex items-center justify-center">
          <Edit2 className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1" />
        {/* Delete action (right side - revealed by swiping left) */}
        <div className="w-20 bg-red-500 flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Card content */}
      <animated.div
        {...bind()}
        style={{ x }}
        className={cn(
          "relative bg-white border rounded-lg p-4",
          "touch-pan-y",
          "shadow-sm",
          isDeleting && "opacity-50"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Time range */}
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="font-medium text-gray-900">
                {entry.start_time} - {entry.end_time}
              </span>
            </div>

            {/* Project */}
            {entry.project && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-600">{entry.project}</span>
              </div>
            )}

            {/* Notes */}
            {entry.notes && (
              <div className="flex items-start gap-2 mt-2">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 line-clamp-2">
                  {entry.notes}
                </span>
              </div>
            )}
          </div>

          {/* Hours badge */}
          <div className="flex-shrink-0">
            <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full">
              <span className="text-sm font-semibold">
                {entry.hours_logged.toFixed(1)}h
              </span>
            </div>
          </div>
        </div>

        {/* Swipe indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="w-1 h-1 rounded-full bg-gray-300" />
          </div>
        </div>
      </animated.div>
    </div>
  );
}
