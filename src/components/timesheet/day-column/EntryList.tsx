
import React from "react";
import { TimesheetEntry, Project } from "@/lib/timesheet-service";
import EntryCard from "../entry-card/EntryCard";

interface EntryListProps {
  entries: TimesheetEntry[];
  projects: Project[];
  canPerformOperations: boolean;
  onEditEntry: (entry: TimesheetEntry) => void;
  onDeleteEntry: (entry: TimesheetEntry) => void;
}

const EntryList: React.FC<EntryListProps> = ({
  entries,
  projects,
  canPerformOperations,
  onEditEntry,
  onDeleteEntry,
}) => {
  if (entries.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        No entries
      </div>
    );
  }

  return (
    <div className="space-y-2 mb-4">
      {entries.map((entry) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          project={projects.find(p => p.id === entry.project_id)}
          canPerformOperations={canPerformOperations}
          onEdit={onEditEntry}
          onDelete={onDeleteEntry}
        />
      ))}
    </div>
  );
};

export default EntryList;
