
import React, { useState } from 'react';
import { EnteredEmployee } from '@/types/childcare-monitor';
import { Search } from 'lucide-react';

interface StaffCardProps {
  roomName: string;
  staff: EnteredEmployee[];
}

const StaffCard: React.FC<StaffCardProps> = ({ roomName, staff }) => {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? staff.filter((e) => e.employeeName.toLowerCase().includes(search.toLowerCase()))
    : staff;

  return (
    <div className="bg-care-darkGreen rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 pb-2 border-b border-care-accentGreen">
        Staff in {roomName} Room
      </h2>

      {staff.length > 3 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-care-lightText" />
          <input
            type="text"
            placeholder="Search staff…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-care-lightGreen border border-care-accentGreen text-white placeholder:text-care-lightText rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-care-accentGreen"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {filtered.length > 0 ? (
          filtered.map((employee) => (
            <div
              key={employee.id}
              className="bg-care-lightGreen px-4 py-2 rounded-full text-white"
            >
              {employee.employeeName}
            </div>
          ))
        ) : staff.length === 0 ? (
          <p className="text-care-lightText">No staff members currently in this room.</p>
        ) : (
          <p className="text-care-lightText">No staff match "{search}".</p>
        )}
      </div>
    </div>
  );
};

export default StaffCard;
