
import React, { useState, useEffect } from 'react';
import { RoomData } from '@/types/childcare-monitor';
import { format } from 'date-fns';

interface RoomInfoCardProps {
  roomData: RoomData | undefined;
}

const getMelbourneTime = () => {
  const now = new Date();
  // Use toLocaleString with Melbourne timezone for accurate time (handles DST)
  return format(
    new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Melbourne' })),
    'dd MMM yyyy, h:mm a'
  );
};

const RoomInfoCard: React.FC<RoomInfoCardProps> = ({ roomData }) => {
  const [melbourneTimeString, setMelbourneTimeString] = useState(getMelbourneTime());

  // Update Melbourne time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setMelbourneTimeString(getMelbourneTime());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!roomData) {
    return (
      <div className="bg-care-darkGreen rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 pb-2 border-b border-care-accentGreen">Current Information</h2>
        <p className="text-care-lightText">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-care-darkGreen rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 pb-2 border-b border-care-accentGreen">Current Information</h2>

      <div className="flex justify-around text-center">
        <div className="bg-care-lightGreen rounded-lg p-4 w-5/12">
          <div className="text-care-lightText text-sm">Children Over 3</div>
          <div className="text-4xl font-bold my-2">{roomData.childrenOver3}</div>
        </div>

        <div className="bg-care-lightGreen rounded-lg p-4 w-5/12">
          <div className="text-care-lightText text-sm">Children Under 3</div>
          <div className="text-4xl font-bold my-2">{roomData.childrenUnder3}</div>
        </div>
      </div>

      <div className="text-right mt-4">
        <div className="text-care-paleGreen text-sm italic">
          Last Updated: {roomData.timestamp}
        </div>
        <div className="text-care-paleGreen text-sm italic">
          Melbourne, Australia: {melbourneTimeString}
        </div>
      </div>
    </div>
  );
};

export default RoomInfoCard;
