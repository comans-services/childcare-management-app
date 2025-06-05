
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { isWeekend } from "@/lib/date-utils";

interface WeekendLockData {
  canLogWeekendHours: boolean;
  isWeekendEntry: (date: Date) => boolean;
  validateWeekendEntry: (date: Date) => { isValid: boolean; message?: string };
  loading: boolean;
  error: string | null;
}

export const useWeekendLock = (userId?: string): WeekendLockData => {
  const { user, userRole } = useAuth();
  const [allowWeekendEntries, setAllowWeekendEntries] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.id;
  const isAdmin = userRole === "admin";

  // Fetch weekend permissions for the user
  const fetchWeekendPermissions = async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      console.log(`Fetching weekend permissions for user: ${targetUserId}`);
      
      const { data, error } = await supabase
        .from("work_schedules")
        .select("allow_weekend_entries")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching weekend permissions:", error);
        setError("Failed to load weekend permissions");
        return;
      }

      const weekendAllowed = data?.allow_weekend_entries || false;
      console.log(`Weekend permissions for user ${targetUserId}: ${weekendAllowed}`);
      setAllowWeekendEntries(weekendAllowed);
      setError(null);
    } catch (err) {
      console.error("Error in fetchWeekendPermissions:", err);
      setError("Failed to load weekend permissions");
    } finally {
      setLoading(false);
    }
  };

  // Load permissions on mount and when targetUserId changes
  useEffect(() => {
    fetchWeekendPermissions();
  }, [targetUserId]);

  // Set up real-time subscription for weekend permission changes
  useEffect(() => {
    if (!targetUserId) return;

    console.log(`Setting up realtime subscription for user ${targetUserId} weekend permissions`);
    
    const channel = supabase
      .channel('weekend-permission-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_schedules',
          filter: `user_id=eq.${targetUserId}`
        },
        (payload) => {
          console.log('Weekend permission realtime update:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new as any;
            if (newData.allow_weekend_entries !== undefined) {
              console.log(`Weekend permission updated to: ${newData.allow_weekend_entries}`);
              setAllowWeekendEntries(newData.allow_weekend_entries);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`Cleaning up realtime subscription for user ${targetUserId} weekend permissions`);
      supabase.removeChannel(channel);
    };
  }, [targetUserId]);

  // Check if a date is a weekend entry
  const isWeekendEntry = (date: Date): boolean => {
    return isWeekend(date);
  };

  // Validate if a weekend entry is allowed
  const validateWeekendEntry = (date: Date): { isValid: boolean; message?: string } => {
    console.log(`Validating weekend entry for date: ${date.toDateString()}`);
    console.log(`Is admin: ${isAdmin}, Allow weekend entries: ${allowWeekendEntries}, Is weekend: ${isWeekend(date)}`);

    // If it's not a weekend, always allow
    if (!isWeekend(date)) {
      return { isValid: true };
    }

    // Admins can always log weekend entries
    if (isAdmin) {
      console.log("Admin override: allowing weekend entry");
      return { isValid: true };
    }

    // Check if user has weekend permission
    if (allowWeekendEntries) {
      console.log("User has weekend permission: allowing entry");
      return { isValid: true };
    }

    console.log("Weekend entry blocked: user does not have permission");
    return { 
      isValid: false, 
      message: "Weekend entries are not allowed. Please contact your administrator for approval." 
    };
  };

  // Determine if user can log weekend hours (admins always can, others need permission)
  const canLogWeekendHours = isAdmin || allowWeekendEntries;

  return {
    canLogWeekendHours,
    isWeekendEntry,
    validateWeekendEntry,
    loading,
    error,
  };
};
