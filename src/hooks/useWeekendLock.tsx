import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { isWeekend } from "@/lib/date-utils";

interface WeekendLockData {
  canLogWeekendHours: boolean;
  isWeekendEntry: (date: Date) => boolean;
  validateWeekendEntry: (date: Date) => { isValid: boolean; message?: string };
  updateWeekendPermission: (enabled: boolean) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  refreshPermissions: () => void;
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

  // Manual refresh function
  const refreshPermissions = () => {
    console.log("Manually refreshing weekend permissions");
    fetchWeekendPermissions();
  };

  // Update weekend permission function
  const updateWeekendPermission = async (enabled: boolean): Promise<boolean> => {
    if (!isAdmin || !targetUserId) {
      console.error("Unauthorized attempt to update weekend permissions");
      return false;
    }

    try {
      console.log(`Updating weekend permission for user ${targetUserId} to: ${enabled}`);
      
      const { error } = await supabase
        .from("work_schedules")
        .upsert({
          user_id: targetUserId,
          allow_weekend_entries: enabled,
          // Keep existing working_days if it exists
          working_days: 5,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("Database error updating weekend permissions:", error);
        toast({
          title: "Error",
          description: "Failed to update weekend permissions. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      // Immediately update local state
      console.log(`Successfully updated weekend permission, updating local state to: ${enabled}`);
      setAllowWeekendEntries(enabled);

      toast({
        title: "Weekend Permissions Updated",
        description: `Weekend entries ${enabled ? 'enabled' : 'disabled'}.`,
      });

      return true;
    } catch (error) {
      console.error("Error updating weekend permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update weekend permissions. Please try again.",
        variant: "destructive",
      });
      return false;
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
      .channel(`weekend-permission-${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_schedules',
          filter: `user_id=eq.${targetUserId}`
        },
        (payload) => {
          console.log('Weekend permission realtime update received:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new as any;
            if (newData.allow_weekend_entries !== undefined) {
              console.log(`Realtime update: Weekend permission changed to: ${newData.allow_weekend_entries}`);
              setAllowWeekendEntries(newData.allow_weekend_entries);
              
              // Show real-time update notification only for current user and only if it's not the user making the change
              if (targetUserId === user?.id) {
                toast({
                  title: "Weekend Permission Updated",
                  description: `Weekend entries ${newData.allow_weekend_entries ? 'enabled' : 'disabled'}.`,
                });
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for user ${targetUserId}:`, status);
      });

    return () => {
      console.log(`Cleaning up realtime subscription for user ${targetUserId} weekend permissions`);
      supabase.removeChannel(channel);
    };
  }, [targetUserId, user?.id]);

  // Check if a date is a weekend entry
  const isWeekendEntry = (date: Date): boolean => {
    return isWeekend(date);
  };

  // Validate if a weekend entry is allowed with admin override
  const validateWeekendEntry = (date: Date): { isValid: boolean; message?: string } => {
    console.log(`Validating weekend entry for date: ${date.toDateString()}`);
    console.log(`Is admin: ${isAdmin}, Allow weekend entries: ${allowWeekendEntries}, Is weekend: ${isWeekend(date)}`);

    // If it's not a weekend, always allow
    if (!isWeekend(date)) {
      return { isValid: true };
    }

    // Admin override: admins can ALWAYS log weekend entries regardless of their settings
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
    updateWeekendPermission,
    loading,
    error,
    refreshPermissions,
  };
};
