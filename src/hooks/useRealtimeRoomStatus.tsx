import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { roomService } from '@/lib/childcare-monitor/room-service';

export const useRealtimeRoomStatus = (roomId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['room-status', roomId],
    queryFn: () => roomService.getRoomStatus(roomId!),
    enabled: !!roomId,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-status-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'childcare_rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log('[Realtime] Room data changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['room-status', roomId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_activity_log',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('[Realtime] Staff activity in room:', payload);
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
