import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRealtimeRoom } from '@/hooks/useRealtimeRoom';
import { useRealtimeRoomStatus } from '@/hooks/useRealtimeRoomStatus';
import { useRealtimeStaffInRoom } from '@/hooks/useRealtimeStaffInRoom';
import { useQueryClient } from '@tanstack/react-query';
import { roomService, Room } from '@/lib/childcare-monitor/room-service';
import RoomInfoCard from '@/components/childcare-monitor/RoomInfoCard';
import StaffCard from '@/components/childcare-monitor/StaffCard';
import RoomUpdateFormComponent from '@/components/childcare-monitor/RoomUpdateForm';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import logo from '@/assets/childcare-monitor-logo.svg';
import { useDeviceAuth } from '@/hooks/useDeviceAuth';
import { useAuth } from '@/context/AuthContext';

const RoomMonitor: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isDevice, isValidating, deviceInfo } = useDeviceAuth();

  // Real-time data fetching
  const { data: room, isLoading: roomLoading } = useRealtimeRoom(roomId);
  const { data: roomStatus, isLoading: statusLoading } = useRealtimeRoomStatus(roomId);
  const { data: staff = [], isLoading: staffLoading } = useRealtimeStaffInRoom(roomId);

  // Check if device is authorized for this room
  const isAuthorizedDevice = isDevice && deviceInfo?.roomId === roomId;
  const canUpdate = isAuthorizedDevice;

  const isLoading = roomLoading || statusLoading || staffLoading || isValidating;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-care-green text-white p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check if device is trying to access wrong room
  if (isDevice && !isAuthorizedDevice) {
    return (
      <div className="min-h-screen bg-care-green text-white p-6 flex items-center justify-center">
        <div className="max-w-md bg-care-darkGreen rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Access Denied</h1>
          <p className="text-care-lightText mb-4">
            This device is not authorized to access this room.
          </p>
          <p className="text-sm text-care-paleGreen">
            Assigned room: {deviceInfo?.roomName}
          </p>
        </div>
      </div>
    );
  }

  if (!room || !roomStatus) {
    return (
      <div className="min-h-screen bg-care-green text-white p-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-care-darkGreen rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
            <p className="mb-4">The requested room does not exist.</p>
            <button
              onClick={() => navigate('/childcare-monitor')}
              className="px-4 py-2 bg-care-brightGreen text-white rounded-md"
            >
              Go to Rooms List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Transform staff data to match component expectations
  const staffForDisplay = staff.map(s => ({
    id: s.staff_id,
    employeeId: s.staff_id,
    employeeName: s.full_name,
    roomId: s.room_id,
    status: 'enter' as const,
    timestamp: format(new Date(s.entered_at), 'dd MMM yyyy, h:mm a'),
  }));

  // Transform room data for RoomInfoCard
  const roomData = {
    id: room.id,
    roomId: room.id,
    roomName: room.name,
    childrenOver3: room.children_over_3,
    childrenUnder3: room.children_under_3,
    timestamp: format(new Date(room.last_updated), 'dd MMM yyyy, h:mm a'),
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      // Handle staff entry/exit
      if (formData.status === 'enter') {
        await roomService.staffEnterRoom(formData.employeeId, formData.roomId);
        toast.success('Staff member entered the room');
      } else {
        await roomService.staffExitRoom(formData.employeeId, formData.roomId);
        toast.success('Staff member exited the room');
      }

      // Update child counts if changed
      if (
        formData.childrenOver3 !== room.children_over_3 ||
        formData.childrenUnder3 !== room.children_under_3
      ) {
        await roomService.updateChildCounts(
          formData.roomId,
          formData.childrenUnder3,
          formData.childrenOver3
        );
        toast.success('Child counts updated');
      }

      // Manually invalidate queries for instant feedback
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      queryClient.invalidateQueries({ queryKey: ['staff-in-room', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-status', roomId] });
    } catch (error) {
      console.error('Error updating room:', error);
      toast.error('Failed to update room data');
    }
  };

  return (
    <div className="min-h-screen bg-care-green text-white p-6">
      <div className="max-w-xl mx-auto">
        {/* Only show back button for logged-in users, not iPad devices */}
        {user && !isDevice && (
          <div className="mb-4">
            <button
              onClick={() => navigate('/childcare-monitor')}
              className="flex items-center text-care-paleGreen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              <span className="ml-1">Back to Rooms</span>
            </button>
          </div>
        )}

        {/* Show access mode indicator */}
        {isDevice && (
          <div className="bg-care-accentGreen rounded-lg p-3 mb-4 text-sm text-center">
            iPad Device Mode - {deviceInfo?.deviceName}
          </div>
        )}
        {user && !isDevice && (
          <div className="bg-care-lightGreen rounded-lg p-3 mb-4 text-sm text-center">
            Admin View Only - Updates Disabled
          </div>
        )}

        {/* Room Header */}
        <div className="flex items-center justify-between mb-6 p-4 bg-care-darkGreen rounded-lg">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2">
            <img src={logo} alt="Room Monitor Logo" className="w-full h-full" />
          </div>
          <h1 className="text-3xl font-bold text-white">The {room.name} Room</h1>
        </div>
        <RoomInfoCard roomData={roomData} />
        <StaffCard roomName={room.name} staff={staffForDisplay} />
        
        {/* Only show update form for authorized iPad devices */}
        {canUpdate && (
          <RoomUpdateFormComponent
            roomId={room.id}
            currentChildrenOver3={room.children_over_3}
            currentChildrenUnder3={room.children_under_3}
            onSubmit={handleFormSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default RoomMonitor;
