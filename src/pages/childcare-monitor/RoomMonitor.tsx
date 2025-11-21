
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RoomHeader from '@/components/childcare-monitor/RoomHeader';
import RoomInfoCard from '@/components/childcare-monitor/RoomInfoCard';
import StaffCard from '@/components/childcare-monitor/StaffCard';
import RoomUpdateFormComponent from '@/components/childcare-monitor/RoomUpdateForm';
import { verifyRoomAccess } from '@/utils/childcare-monitor/roomUtils';
import { RoomUpdateForm as RoomUpdateFormType, StatusType } from '@/types/childcare-monitor';
import {
  employees,
  rooms,
  getLatestRoomData,
  getEmployeesInRoom,
  getRoomById,
  getEmployeeById,
  updateRoomData,
  updateStaffPresence,
  isEmployeeInAnyRoom,
  getEmployeeCurrentRoom
} from '@/data/childcare-monitor/mockData';
import { formatDate } from '@/utils/childcare-monitor/roomUtils';
import { toast } from 'sonner';

const RoomMonitor: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState(getRoomById(roomId || '1'));
  const [roomData, setRoomData] = useState(getLatestRoomData(roomId || '1'));
  const [staff, setStaff] = useState(getEmployeesInRoom(roomId || '1'));
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    if (!roomId) {
      navigate('/childcare-monitor/rooms/1');
      return;
    }

    const selectedRoom = getRoomById(roomId);
    if (!selectedRoom) {
      navigate('/childcare-monitor/rooms');
      return;
    }

    // Verify MAC address access
    const hasRoomAccess = verifyRoomAccess(roomId);
    setHasAccess(hasRoomAccess);

    if (!hasRoomAccess) {
      toast.error('Access denied. This device is not authorized for this room.');
      return;
    }

    // Load room data
    setRoom(selectedRoom);
    setRoomData(getLatestRoomData(roomId));
    setStaff(getEmployeesInRoom(roomId));
  }, [roomId, navigate]);

  const handleFormSubmit = (formData: RoomUpdateFormType) => {
    // In a real app, this would send data to the server/database
    const currentDate = new Date();
    const updatedEmployee = getEmployeeById(formData.employeeId);
    const updatedRoom = getRoomById(formData.roomId);

    if (!updatedEmployee || !updatedRoom) {
      toast.error('Error: Employee or room not found');
      return;
    }

    // Check for duplicate staff
    if (formData.status === StatusType.ENTER && isEmployeeInAnyRoom(formData.employeeId)) {
      const currentRoom = getEmployeeCurrentRoom(formData.employeeId);
      toast.error(`${updatedEmployee.name} is already in the ${currentRoom?.name} Room.`);
      return;
    }

    // Update room data
    const newRoomData = {
      id: `${Date.now()}`, // Generate unique ID for demo
      roomId: formData.roomId,
      roomName: updatedRoom.name,
      childrenOver3: formData.childrenOver3,
      childrenUnder3: formData.childrenUnder3,
      timestamp: formatDate(currentDate),
    };

    // Update staff list based on enter/exit
    const newStaffEntry = {
      id: `${Date.now()}`,
      employeeId: formData.employeeId,
      employeeName: updatedEmployee.name,
      roomId: formData.roomId,
      status: formData.status,
      timestamp: formatDate(currentDate),
    };

    // In a real app, these would be API calls to update the database
    updateRoomData(newRoomData);
    updateStaffPresence(newStaffEntry);

    // Update local state
    setRoomData(newRoomData);

    // Update staff list
    if (formData.status === StatusType.ENTER) {
      // Add staff member if entering
      setStaff(prev => [...prev, newStaffEntry]);
      toast.success(`${updatedEmployee.name} has entered the ${updatedRoom.name} Room.`);
    } else {
      // Remove staff member if exiting
      setStaff(prev => prev.filter(emp => emp.employeeId !== formData.employeeId));
      toast.success(`${updatedEmployee.name} has exited the ${updatedRoom.name} Room.`);
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-care-green text-white p-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-care-darkGreen rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="mb-4">This device is not authorized to access this room's monitor.</p>
            <p className="text-sm text-care-paleGreen">
              Please use an authorized device located in this room.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!room || !roomData) {
    return (
      <div className="min-h-screen bg-care-green text-white p-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-care-darkGreen rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
            <p className="mb-4">The requested room does not exist.</p>
            <button
              onClick={() => navigate('/childcare-monitor/rooms')}
              className="px-4 py-2 bg-care-brightGreen hover:bg-care-hoverGreen rounded-md"
            >
              Go to Rooms List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-care-green text-white p-6">
      <div className="max-w-xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => navigate('/childcare-monitor/rooms')}
            className="flex items-center text-care-paleGreen hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span className="ml-1">Back to Rooms</span>
          </button>
        </div>

        <RoomHeader room={room} />
        <RoomInfoCard roomData={roomData} />
        <StaffCard roomName={room.name} staff={staff} />
        <RoomUpdateFormComponent
          roomId={room.id}
          currentChildrenOver3={roomData.childrenOver3}
          currentChildrenUnder3={roomData.childrenUnder3}
          onSubmit={handleFormSubmit}
        />
      </div>
    </div>
  );
};

export default RoomMonitor;
