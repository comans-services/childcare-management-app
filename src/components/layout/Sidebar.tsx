
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  ClipboardList, 
  BarChart2, 
  Briefcase, 
  Users, 
  Settings,
  Building2 
} from "lucide-react";

const Sidebar = () => {
  const { userRole } = useAuth();
  
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
      isActive
        ? "bg-blue-100 text-blue-600"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <aside className="w-64 bg-white shadow-sm h-[calc(100vh-64px)] p-4">
      <nav className="space-y-1">
        <NavLink to="/timesheet" className={navLinkClass}>
          <ClipboardList className="h-5 w-5" />
          <span>My Timesheet</span>
        </NavLink>
        
        <NavLink to="/projects" className={navLinkClass}>
          <Briefcase className="h-5 w-5" />
          <span>Projects</span>
        </NavLink>

        <NavLink to="/customers" className={navLinkClass}>
          <Building2 className="h-5 w-5" />
          <span>Customers</span>
        </NavLink>
        
        {(userRole === "admin" || userRole === "manager") && (
          <>
            <NavLink to="/reports" className={navLinkClass}>
              <BarChart2 className="h-5 w-5" />
              <span>Reports</span>
            </NavLink>
            
            <NavLink to="/team" className={navLinkClass}>
              <Users className="h-5 w-5" />
              <span>Team</span>
            </NavLink>
          </>
        )}
        
        <NavLink to="/settings" className={navLinkClass}>
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
