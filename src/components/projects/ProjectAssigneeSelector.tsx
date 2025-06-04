
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  full_name?: string;
  email?: string;
}

interface ProjectAssigneeSelectorProps {
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
  disabled?: boolean;
  className?: string;
}

const ProjectAssigneeSelector: React.FC<ProjectAssigneeSelectorProps> = ({
  selectedUserIds,
  onSelectionChange,
  disabled = false,
  className,
}) => {
  const [open, setOpen] = useState(false);

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data as User[];
    },
  });

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));

  const handleSelect = (userId: string) => {
    const isSelected = selectedUserIds.includes(userId);
    if (isSelected) {
      onSelectionChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onSelectionChange([...selectedUserIds, userId]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    onSelectionChange(selectedUserIds.filter(id => id !== userId));
  };

  const formatUserName = (user: User) => {
    return user.full_name || user.email || "Unknown User";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedUsers.length > 0
              ? `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} assigned`
              : "Assign users to project..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandEmpty>
              {isLoading ? "Loading users..." : "No users found."}
            </CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleSelect(user.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{formatUserName(user)}</span>
                    {user.full_name && user.email && (
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              {formatUserName(user)}
              {!disabled && (
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => handleRemoveUser(user.id)}
                />
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectAssigneeSelector;
