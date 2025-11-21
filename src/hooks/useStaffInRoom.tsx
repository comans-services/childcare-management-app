import { useQuery } from "@tanstack/react-query";
import { roomService } from "@/lib/childcare-monitor/room-service";

export const useStaffInRoom = (roomId: string | undefined) => {
  return useQuery({
    queryKey: ["staff-in-room", roomId],
    queryFn: () => roomService.getStaffInRoom(roomId!),
    enabled: !!roomId,
    refetchInterval: 15000, // Refresh every 15 seconds
  });
};

export const useAllStaff = () => {
  return useQuery({
    queryKey: ["all-staff"],
    queryFn: () => roomService.getAllStaff(),
  });
};

export const useStaffCurrentRoom = (staffId: string | undefined) => {
  return useQuery({
    queryKey: ["staff-current-room", staffId],
    queryFn: () => roomService.getStaffCurrentRoom(staffId!),
    enabled: !!staffId,
  });
};
