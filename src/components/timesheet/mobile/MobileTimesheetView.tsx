import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { WeekStrip } from "./WeekStrip";
import { QuickStats } from "./QuickStats";
import { MobileEntryCard, TimesheetEntry } from "./MobileEntryCard";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";

export interface MobileTimesheetViewProps {
  weekDates: Date[];
  entries: TimesheetEntry[];
  expectedHours: number;
  expectedDays: number;
  onCreateEntry: (date: Date) => void;
  onEditEntry: (entry: TimesheetEntry) => void;
  onDeleteEntry: (entry: TimesheetEntry) => void;
}

export function MobileTimesheetView({
  weekDates,
  entries,
  expectedHours,
  expectedDays,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
}: MobileTimesheetViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(weekDates[0] || new Date());

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    const totals = new Map<string, number>();
    entries.forEach(entry => {
      const dateKey = entry.entry_date;
      totals.set(dateKey, (totals.get(dateKey) || 0) + entry.hours_logged);
    });
    return totals;
  }, [entries]);

  // Calculate week totals
  const weekTotals = useMemo(() => {
    let totalHours = 0;
    const daysWithEntries = new Set<string>();

    entries.forEach(entry => {
      totalHours += entry.hours_logged;
      daysWithEntries.add(entry.entry_date);
    });

    return {
      totalHours,
      daysWorked: daysWithEntries.size,
    };
  }, [entries]);

  // Filter entries for selected date
  const selectedDateEntries = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return entries.filter(entry => entry.entry_date === dateKey);
  }, [entries, selectedDate]);

  const handleCreateEntry = () => {
    onCreateEntry(selectedDate);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Week strip */}
      <WeekStrip
        weekDates={weekDates}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        dailyTotals={dailyTotals}
      />

      {/* Quick stats */}
      <QuickStats
        totalHours={weekTotals.totalHours}
        expectedHours={expectedHours}
        daysWorked={weekTotals.daysWorked}
        expectedDays={expectedDays}
      />

      {/* Entry list */}
      <div className="flex-1 overflow-y-auto px-3 pb-24">
        {/* Selected date header */}
        <div className="sticky top-0 bg-gray-50 pt-3 pb-2 z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h2>
          <p className="text-sm text-gray-500">
            {selectedDateEntries.length} {selectedDateEntries.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        {/* Entries */}
        {selectedDateEntries.length > 0 ? (
          <div className="space-y-2">
            {selectedDateEntries.map(entry => (
              <MobileEntryCard
                key={entry.id}
                entry={entry}
                onEdit={onEditEntry}
                onDelete={onDeleteEntry}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-1">No entries yet</p>
            <p className="text-sm text-gray-500">
              Tap the + button to add your first entry
            </p>
          </div>
        )}
      </div>

      {/* FAB for quick entry */}
      <FloatingActionButton
        icon={Plus}
        onClick={handleCreateEntry}
        label="Add Entry"
        position="bottom-right"
      />
    </div>
  );
}
