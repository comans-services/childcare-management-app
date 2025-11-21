import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrentRoomStatus } from '@/hooks/useRoomStatus';
import { Loader2 } from 'lucide-react';

const ChildcareMonitorIndex: React.FC = () => {
  const { data: rooms, isLoading } = useCurrentRoomStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-care-green text-white p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-care-green text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-care-darkGreen rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4 text-center">Childcare Room Monitors</h1>
          <p className="text-center mb-6 text-care-lightText">
            Select a room to view and update its information.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {rooms?.map((room) => {
              const totalChildren = room.total_children || 0;
              const isCompliant = room.is_compliant || false;

              return (
                <Link
                  key={room.id}
                  to={`/childcare-monitor/room/${room.id}`}
                  className={`${isCompliant ? 'bg-care-lightGreen' : 'bg-yellow-800'} hover:bg-care-brightGreen transition-colors p-4 rounded-lg`}
                >
                  <h2 className="text-xl font-bold mb-2">The {room.name} Room</h2>
                  <div className="flex gap-2 mb-2">
                    <div className="bg-care-darkGreen px-2 py-1 rounded text-sm">
                      Staff: {room.current_staff_count || 0}
                    </div>
                    <div className="bg-care-darkGreen px-2 py-1 rounded text-sm">
                      Children: {totalChildren}
                    </div>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <div className="bg-care-darkGreen px-2 py-1 rounded text-sm">
                      Over 3: {room.children_over_3 || 0}
                    </div>
                    <div className="bg-care-darkGreen px-2 py-1 rounded text-sm">
                      Under 3: {room.children_under_3 || 0}
                    </div>
                  </div>
                  <div className="text-sm text-care-paleGreen">
                    Last updated: {room.last_updated ? new Date(room.last_updated).toLocaleString() : 'Never'}
                  </div>
                  {!isCompliant && (
                    <div className="mt-2 text-yellow-200 text-sm">
                      ⚠️ Warning: Educator-to-child ratio not met
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="bg-care-darkGreen rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">About the Room Monitor</h2>
          <p className="mb-4 text-care-lightText">
            This application helps track children and staff in childcare rooms while ensuring
            proper educator-to-child ratios are maintained.
          </p>
          <div className="bg-care-lightGreen p-4 rounded-lg mb-4">
            <h3 className="font-bold mb-2">Educator-to-Child Ratios</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Children under 3 years: 1 educator for every 4 children (1:4)</li>
              <li>Children 3 years and older: 1 educator for every 15 children (1:15)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildcareMonitorIndex;
