import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { roomService } from '@/lib/childcare-monitor/room-service';

export const useRealtimeStaffInRoom = (roomId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['staff-in-room', roomId],
    queryFn: () => roomService.getStaffInRoom(roomId!),
    enabled: !!roomId,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`staff-activity-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_activity_log',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('[Realtime] Staff activity detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['staff-in-room', roomId] });
          queryClient.invalidateQueries({ queryKey: ['room-status', roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return query;
};
