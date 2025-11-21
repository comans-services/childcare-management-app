
import React from 'react';
import { Room } from '@/types/childcare-monitor';
import logo from '@/assets/childcare-monitor-logo.svg';

interface RoomHeaderProps {
  room: Room;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ room }) => {
  return (
    <div className="flex items-center justify-between mb-6 p-4 bg-care-darkGreen rounded-lg">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2">
        <img src={logo} alt="Room Monitor Logo" className="w-full h-full" />
      </div>
      <h1 className="text-3xl font-bold text-white">The {room.name} Room</h1>
    </div>
  );
};

export default RoomHeader;
