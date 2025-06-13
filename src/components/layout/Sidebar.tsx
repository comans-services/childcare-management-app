import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  CalendarDays, 
  BarChart3, 
  Users, 
  FolderOpen, 
  Settings, 
  Menu, 
  X, 
  Building2, 
  FileText,
  Clock,
  Shield
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  badge: string | null;
}

const Sidebar = () => {
  const { userRole } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navItems = [
    {
      href: "/timesheet",
      icon: CalendarDays,
      label: "Timesheet",
      badge: null
    },
    {
      href: "/reports",
      icon: BarChart3,
      label: "Reports",
      badge: null
    },
    
    // Admin-only items
    ...(userRole === 'admin' ? [
      {
        href: "/projects",
        icon: FolderOpen,
        label: "Projects",
        badge: null
      },
      {
        href: "/team",
        icon: Users,
        label: "Team",
        badge: null
      },
      {
        href: "/customers",
        icon: Building2,
        label: "Customers",
        badge: null
      },
      {
        href: "/contracts",
        icon: FileText,
        label: "Contracts",
        badge: null
      },
      {
        href: "/work-schedule",
        icon: Clock,
        label: "Work Schedule",
        badge: null
      },
      {
        href: "/audit-logs",
        icon: Shield,
        label: "Audit Logs",
        badge: null
      }
    ] : []),
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-50 border-r border-gray-200 py-4">
        <div className="px-6 py-2">
          <Link to="/" className="font-bold text-lg text-gray-800">
            Timesheet App
          </Link>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-200 hover:text-gray-900 transition-colors duration-200",
                location.pathname === item.href
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700"
              )}
            >
              <item.icon className="h-4 w-4 mr-2 opacity-75 group-hover:opacity-100" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-4">
          <Link to="/settings" className="flex items-center text-sm text-gray-600 hover:text-gray-800">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <Link to="/" className="font-bold text-lg text-gray-800">
                Timesheet App
              </Link>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={closeMenu}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-200 hover:text-gray-900 transition-colors duration-200",
                    location.pathname === item.href
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-700"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-2 opacity-75 group-hover:opacity-100" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-200 p-4">
              <Link to="/settings" onClick={closeMenu} className="flex items-center text-sm text-gray-600 hover:text-gray-800">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
