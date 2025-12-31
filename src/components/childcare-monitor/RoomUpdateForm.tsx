import React, { useState, useEffect } from 'react';
import { RoomUpdateForm as RoomUpdateFormType, StatusType } from '@/types/childcare-monitor';
import { validateEducatorChildRatio } from '@/utils/childcare-monitor/roomUtils';
import { useRooms } from '@/hooks/useRoomStatus';
import { useAllStaff } from '@/hooks/useStaffInRoom';
import { roomService } from '@/lib/childcare-monitor/room-service';

interface RoomUpdateFormProps {
  roomId: string;
  currentChildrenOver3: number;
  currentChildrenUnder3: number;
  onSubmit: (formData: RoomUpdateFormType) => void;
}

const RoomUpdateFormComponent: React.FC<RoomUpdateFormProps> = ({
  roomId: initialRoomId,
  currentChildrenOver3,
  currentChildrenUnder3,
  onSubmit
}) => {
  const { data: rooms } = useRooms();
  const { data: allStaff } = useAllStaff();
  
  const [status, setStatus] = useState<StatusType>(StatusType.ENTER);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>(initialRoomId);
  const [over3Count, setOver3Count] = useState<number>(currentChildrenOver3);
  const [under3Count, setUnder3Count] = useState<number>(currentChildrenUnder3);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [staffError, setStaffError] = useState<string>('');
  const [staffInRoomMap, setStaffInRoomMap] = useState<Map<string, string>>(new Map());
  const [currentStaffCount, setCurrentStaffCount] = useState<number>(0);

  // Load staff room status
  useEffect(() => {
    const loadStaffStatus = async () => {
      if (!allStaff) return;
      
      const map = new Map<string, string>();
      let countInCurrentRoom = 0;
      
      for (const staff of allStaff) {
        const currentRoom = await roomService.getStaffCurrentRoom(staff.id);
        if (currentRoom) {
          map.set(staff.id, currentRoom);
          if (currentRoom === initialRoomId) {
            countInCurrentRoom++;
          }
        }
      }
      setStaffInRoomMap(map);
      setCurrentStaffCount(countInCurrentRoom);
    };
    
    loadStaffStatus();
  }, [allStaff, initialRoomId]);

  // Filter employees based on status
  const availableEmployees = (allStaff || []).filter((employee) => {
    const employeeCurrentRoom = staffInRoomMap.get(employee.id);

    if (status === StatusType.ENTER) {
      return !employeeCurrentRoom;
    } else {
      return employeeCurrentRoom === initialRoomId;
    }
  });

  // Set default values
  useEffect(() => {
    setRoomId(initialRoomId);
    if (availableEmployees.length > 0) {
      setEmployeeId(availableEmployees[0].id);
    } else {
      setEmployeeId('');
    }
    setOver3Count(currentChildrenOver3);
    setUnder3Count(currentChildrenUnder3);
  }, [initialRoomId, currentChildrenOver3, currentChildrenUnder3, availableEmployees.length]);

  // Update available employees when status changes
  useEffect(() => {
    if (availableEmployees.length > 0) {
      setEmployeeId(availableEmployees[0].id);
      setStaffError('');
    } else {
      setEmployeeId('');
      if (status === StatusType.ENTER) {
        setStaffError('No available staff members to enter this room.');
      } else {
        setStaffError('No staff members currently in this room to exit.');
      }
    }
  }, [status, availableEmployees.length]);

  // Validate the form whenever counts change
  useEffect(() => {
    let newStaffCount = currentStaffCount;
    if (status === StatusType.ENTER) {
      newStaffCount += 1;
    } else if (status === StatusType.EXIT && currentStaffCount > 0) {
      newStaffCount -= 1;
    }

    const { isValid, message } = validateEducatorChildRatio(
      newStaffCount,
      under3Count,
      over3Count
    );

    setIsValid(isValid);
    setValidationMessage(message);
  }, [status, over3Count, under3Count, currentStaffCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      return;
    }

    onSubmit({
      status,
      employeeId,
      roomId,
      childrenOver3: over3Count,
      childrenUnder3: under3Count,
    });
  };

  return (
    <div className="bg-care-darkGreen rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4 pb-2 border-b border-care-accentGreen">
        Update Room Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status */}
        <div>
          <label className="block text-care-lightText mb-2">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusType)}
            className="w-full p-3 bg-care-green text-white rounded-md border border-care-accentGreen focus:border-care-brightGreen focus:outline-none focus:ring-1 focus:ring-care-brightGreen"
          >
            <option value={StatusType.ENTER}>Enter</option>
            <option value={StatusType.EXIT}>Exit</option>
          </select>
        </div>

        {/* Employee Name */}
        <div>
          <label className="block text-care-lightText mb-2">Employee Name</label>
          {staffError ? (
            <div className="p-3 bg-yellow-800 text-yellow-100 rounded-md mb-2">
              {staffError}
            </div>
          ) : (
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full p-3 bg-care-green text-white rounded-md border border-care-accentGreen focus:border-care-brightGreen focus:outline-none focus:ring-1 focus:ring-care-brightGreen"
              disabled={availableEmployees.length === 0}
            >
              {availableEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Room Name */}
        <div>
          <label className="block text-care-lightText mb-2">Room Name</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full p-3 bg-care-green text-white rounded-md border border-care-accentGreen focus:border-care-brightGreen focus:outline-none focus:ring-1 focus:ring-care-brightGreen"
            disabled
          >
            {(rooms || []).map((room) => (
              <option key={room.id} value={room.id}>
                The {room.name} Room
              </option>
            ))}
          </select>
        </div>

        {/* Children Over 3 */}
        <div>
          <label className="block text-care-lightText mb-2">Children Over 3</label>
          <input
            type="number"
            min="0"
            value={over3Count}
            onChange={(e) => setOver3Count(parseInt(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            className="w-full p-3 bg-care-green text-white rounded-md border border-care-accentGreen focus:border-care-brightGreen focus:outline-none focus:ring-1 focus:ring-care-brightGreen"
          />
        </div>

        {/* Children Under 3 */}
        <div>
          <label className="block text-care-lightText mb-2">Children Under 3</label>
          <input
            type="number"
            min="0"
            value={under3Count}
            onChange={(e) => setUnder3Count(parseInt(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            className="w-full p-3 bg-care-green text-white rounded-md border border-care-accentGreen focus:border-care-brightGreen focus:outline-none focus:ring-1 focus:ring-care-brightGreen"
          />
        </div>

        {/* Validation message */}
        {!isValid && (
          <div className="p-3 bg-yellow-800 text-yellow-100 rounded-md">
            ⚠️ {validationMessage}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          className="w-full p-3 bg-care-brightGreen text-white rounded-md"
          disabled={availableEmployees.length === 0}
        >
          Update Room
        </button>
      </form>
    </div>
  );
};

export default RoomUpdateFormComponent;
