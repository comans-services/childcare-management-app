
import React, { useState, useEffect } from 'react';
import { Employee, Room, StatusType } from '@/types/childcare-monitor';
import type { RoomUpdateForm } from '@/types/childcare-monitor';
import { validateEducatorChildRatio } from '@/utils/childcare-monitor/roomUtils';
import { isEmployeeInAnyRoom, getEmployeeCurrentRoom } from '@/data/childcare-monitor/mockData';

interface RoomUpdateFormProps {
  employees: Employee[];
  rooms: Room[];
  currentRoom: Room;
  currentStaffCount: number;
  childrenOver3: number;
  childrenUnder3: number;
  onSubmit: (formData: RoomUpdateForm) => void;
}

const RoomUpdateFormComponent: React.FC<RoomUpdateFormProps> = ({
  employees,
  rooms,
  currentRoom,
  currentStaffCount,
  childrenOver3,
  childrenUnder3,
  onSubmit,
}) => {
  const [status, setStatus] = useState<StatusType>(StatusType.ENTER);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [over3Count, setOver3Count] = useState<number>(childrenOver3);
  const [under3Count, setUnder3Count] = useState<number>(childrenUnder3);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [staffError, setStaffError] = useState<string>('');

  // Filter out employees who are already in other rooms if status is ENTER
  const availableEmployees = employees.filter(employee => {
    if (status === StatusType.ENTER) {
      // If entering, only show employees not already in any room
      return !isEmployeeInAnyRoom(employee.id);
    } else {
      // If exiting, only show employees in current room
      const currentRoom = getEmployeeCurrentRoom(employee.id);
      return currentRoom && currentRoom.id === roomId;
    }
  });

  // Set default values
  useEffect(() => {
    setRoomId(currentRoom.id);
    if (availableEmployees.length > 0) {
      setEmployeeId(availableEmployees[0].id);
    } else {
      setEmployeeId('');
    }
    setOver3Count(childrenOver3);
    setUnder3Count(childrenUnder3);
  }, [currentRoom.id, childrenOver3, childrenUnder3, availableEmployees, status]);

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
  }, [status, availableEmployees]);

  // Validate the form whenever counts change
  useEffect(() => {
    // Calculate the new staff count based on current form
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
      // Don't submit if no employee is selected
      return;
    }

    // Submit even if not valid, but show warning
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
                  {employee.name}
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
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
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
          className="w-full p-3 bg-care-brightGreen hover:bg-care-hoverGreen text-white rounded-md transition-colors"
          disabled={availableEmployees.length === 0}
        >
          Update Room
        </button>
      </form>
    </div>
  );
};

export default RoomUpdateFormComponent;
