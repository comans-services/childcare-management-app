
import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface UserSelectorProps {
  selectedUserId: string | null;
  onUserSelect: (userId: string | null) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ selectedUserId, onUserSelect }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (value: string) => {
    if (value === "all") {
      onUserSelect(null);
    } else {
      onUserSelect(value);
    }
  };

  const getUserDisplayName = (user: User) => {
    return user.full_name || user.email || "Unknown User";
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 min-w-[200px]">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <Users className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedUserId || "all"} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select user..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {getUserDisplayName(user)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserSelector;
