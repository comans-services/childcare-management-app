
import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Home, Calendar, Users, Settings, FileText, FolderKanban, BarChart, UserPlus, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const SidebarContent = ({ isCollapsed = false, onToggleCollapse }: { 
  isCollapsed?: boolean; 
  onToggleCollapse?: () => void; 
}) => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  // Define which navigation items are available for each role
  const isAdmin = userRole === "admin";
  const isEmployee = userRole === "employee";

  const navigationItems = [
    { to: "/", icon: Home, label: "Home", showForAll: true },
    { to: "/timesheet", icon: Calendar, label: "Timesheet", showForAll: true },
    { to: "/projects", icon: FolderKanban, label: "Projects", adminOnly: true },
    { to: "/customers", icon: Users, label: "Customers", adminOnly: true },
    { to: "/contracts", icon: FileText, label: "Contracts", adminOnly: true },
    { to: "/reports", icon: BarChart, label: "Reports", adminOnly: true },
    { to: "/team", icon: UserPlus, label: "Team", adminOnly: true },
    { to: "/work-schedule", icon: Clock, label: "Work Schedule", adminOnly: true },
  ];

  const filteredItems = navigationItems.filter(item => 
    item.showForAll || (item.adminOnly && isAdmin)
  );

  return (
    <>
      {/* Header with collapse toggle for desktop */}
      <div className={`p-4 ${isCollapsed ? 'px-2' : ''} transition-all duration-300`}>
        {!isCollapsed ? (
          <>
            <h2 className="text-xl font-semibold">Timesheet App</h2>
            <p className="text-sm text-muted-foreground">Manage your time</p>
          </>
        ) : (
          <div className="text-center">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-sm">
              TA
            </div>
          </div>
        )}
        
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="mt-2 w-full hidden lg:flex items-center justify-center"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>
      
      <Separator className="my-2" />
      
      {/* Navigation items */}
      <div className="flex flex-col space-y-1 p-2">
        {filteredItems.map((item) => (
          <Link 
            key={item.to}
            to={item.to} 
            className={`
              flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2
              ${isCollapsed ? 'justify-center' : ''}
              transition-all duration-300
            `}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </div>
      
      <Separator className="my-2" />
      
      {/* Settings and logout */}
      <div className="flex flex-col space-y-1 p-2">
        <Link 
          to="/settings" 
          className={`
            flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2
            ${isCollapsed ? 'justify-center' : ''}
            transition-all duration-300
          `}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Link>
        
        <Button 
          variant="ghost" 
          className={`
            justify-start
            ${isCollapsed ? 'px-2' : ''}
            transition-all duration-300
          `}
          onClick={handleLogout}
          title={isCollapsed ? "Log Out" : undefined}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-2'}`}>
            <div className="h-5 w-5 flex-shrink-0">↗</div>
            {!isCollapsed && <span>Log Out</span>}
          </div>
        </Button>
      </div>
    </>
  );
};

const Sidebar = () => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse logic for medium screens (1024px-1280px)
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      // Auto-collapse on medium screens (1024px-1280px)
      if (width >= 1024 && width < 1280) {
        setIsCollapsed(true);
      }
      // Auto-expand on larger screens
      else if (width >= 1280) {
        setIsCollapsed(false);
      }
    };

    // Set initial state
    handleResize();
    
    // Listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile sidebar
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar with collapse functionality
  return (
    <div className={`
      ${isCollapsed ? 'w-12' : 'w-full'} 
      h-full transition-all duration-300 ease-in-out
    `}>
      <SidebarContent 
        isCollapsed={isCollapsed} 
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)} 
      />
    </div>
  );
};

export default Sidebar;
