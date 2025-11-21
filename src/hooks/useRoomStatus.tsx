import { useQuery } from "@tanstack/react-query";
import { roomService } from "@/lib/childcare-monitor/room-service";

export const useRoomStatus = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ["room-status", roomId],
    queryFn: () => roomService.getRoomStatus(roomId!),
    enabled: !!roomId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useRooms = () => {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomService.getRooms(),
    refetchInterval: 30000,
  });
};

export const useCurrentRoomStatus = () => {
  return useQuery({
    queryKey: ["current-room-status"],
    queryFn: () => roomService.getCurrentRoomStatus(),
    refetchInterval: 15000, // More frequent for overview
  });
};

export const useRoomActivityLog = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ["room-activity-log", roomId],
    queryFn: () => roomService.getRoomActivityLog(roomId!),
    enabled: !!roomId,
  });
};
