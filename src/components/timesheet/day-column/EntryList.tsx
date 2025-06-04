
import React from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { AnyTimeEntry } from "@/lib/timesheet-service";
import { cn } from "@/lib/utils";
import EntryCard from "../entry-card/EntryCard";

interface EntryListProps {
  droppableId: string;
  entries: AnyTimeEntry[];
  onEditEntry: (entry: AnyTimeEntry) => void;
  onDeleteEntry: (entry: AnyTimeEntry) => void;
  onEntryChange: () => void;
}

const EntryList: React.FC<EntryListProps> = ({
  droppableId,
  entries,
  onEditEntry,
  onDeleteEntry,
  onEntryChange,
}) => {
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef} 
          {...provided.droppableProps}
          className={cn(
            "flex flex-col space-y-2 min-h-[50px] p-1 transition-colors rounded-md",
            snapshot.isDraggingOver ? "bg-primary/5" : ""
          )}
        >
          {entries.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
              No entries for this day
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {entries.map((entry, index) => (
                <Draggable 
                  key={entry.id || `temp-${Date.now()}-${Math.random()}`} 
                  draggableId={entry.id || `temp-${Date.now()}-${Math.random()}`} 
                  index={index}
                  isDragDisabled={!entry.id || ('contract_id' in entry)}
                >
                  {(provided, snapshot) => (
                    <EntryCard 
                      entry={entry}
                      provided={provided}
                      snapshot={snapshot}
                      onEditEntry={onEditEntry}
                      onDeleteEntry={onDeleteEntry}
                      onEntryChange={onEntryChange}
                    />
                  )}
                </Draggable>
              ))}
            </div>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default EntryList;
