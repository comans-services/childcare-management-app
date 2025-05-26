
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  FolderOpen,
  FileText,
  Users,
  BarChart3,
  Settings,
  Shield,
  Building2,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const { userRole } = useAuth();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: BarChart3,
      allowedRoles: ["admin", "staff"],
    },
    {
      name: "Timesheet",
      path: "/timesheet",
      icon: Calendar,
      allowedRoles: ["admin", "staff"],
    },
    {
      name: "Projects",
      path: "/projects",
      icon: FolderOpen,
      allowedRoles: ["admin"],
    },
    {
      name: "Contracts",
      path: "/contracts",
      icon: FileText,
      allowedRoles: ["admin"],
    },
    {
      name: "Customers",
      path: "/customers",
      icon: Building2,
      allowedRoles: ["admin"],
    },
    {
      name: "Reports",
      path: "/reports",
      icon: BarChart3,
      allowedRoles: ["admin"],
    },
    {
      name: "Team",
      path: "/team",
      icon: Users,
      allowedRoles: ["admin"],
    },
    {
      name: "Admin",
      path: "/admin",
      icon: Shield,
      allowedRoles: ["admin"],
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      allowedRoles: ["admin", "staff"],
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const filteredMenuItems = menuItems.filter(item => 
    userRole && item.allowedRoles.includes(userRole)
  );

  return (
    <nav className="p-4 space-y-2">
      {filteredMenuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive(item.path)
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default Sidebar;
