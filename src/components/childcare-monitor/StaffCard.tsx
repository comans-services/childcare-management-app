
import React from 'react';
import { EnteredEmployee } from '@/types/childcare-monitor';

interface StaffCardProps {
  roomName: string;
  staff: EnteredEmployee[];
}

const StaffCard: React.FC<StaffCardProps> = ({ roomName, staff }) => {
  return (
    <div className="bg-care-darkGreen rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 pb-2 border-b border-care-accentGreen">
        Staff in {roomName} Room
      </h2>

      <div className="flex flex-wrap gap-2">
        {staff.length > 0 ? (
          staff.map((employee) => (
            <div
              key={employee.id}
              className="bg-care-lightGreen px-4 py-2 rounded-full text-white"
            >
              {employee.employeeName}
            </div>
          ))
        ) : (
          <p className="text-care-lightText">No staff members currently in this room.</p>
        )}
      </div>
    </div>
  );
};

export default StaffCard;
