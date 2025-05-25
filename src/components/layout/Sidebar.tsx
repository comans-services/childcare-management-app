
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Home, Calendar, Users, Settings, FileText, FolderKanban, BarChart, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRBAC } from "@/hooks/use-rbac";

const SidebarContent = () => {
  const { user, signOut } = useAuth();
  const { canAccessProjects, canAccessContracts, canAccessTeamManagement, canAccessCustomers } = useRBAC();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <>
      <div className="p-4">
        <h2 className="text-xl font-semibold">Timesheet App</h2>
        <p className="text-sm text-muted-foreground">Manage your time</p>
      </div>
      <Separator className="my-2" />
      <div className="flex flex-col space-y-1 p-2">
        <Link to="/" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2">
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>
        <Link to="/timesheet" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2">
          <Calendar className="h-5 w-5" />
          <span>Timesheet</span>
        </Link>
        
        {/* Admin-only menu items */}
        {canAccessProjects && (
          <Link to="/projects" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2">
            <FolderKanban className="h-5 w-5" />
            <span>Projects</span>
          </Link>
        )}
        
        {canAccessCustomers && (
          <Link to="/customers" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2">
            <Users className="h-5 w-5" />
            <span>Customers</span>
          </Link>
        )}
        
        {canAccessContracts && (
          <Link to="/contracts" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2">
            <FileText className="h-5 w-5" />
            <span>Contracts</span>
          </Link>
        )}
        
        {canAccessTeamManagement && (
          <>
            <Link to="/reports" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2">
              <BarChart className="h-5 w-5" />
              <span>Reports</span>
            </Link>
            <Link to="/team" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2">
              <UserPlus className="h-5 w-5" />
              <span>Team</span>
            </Link>
          </>
        )}
      </div>
      <Separator className="my-2" />
      <div className="flex flex-col space-y-1 p-2">
        <Link to="/settings" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2">
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
        <Button variant="ghost" className="justify-start" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
    </>
  );
};

const Sidebar = () => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <SidebarContent />;
  }
  
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
};

export default Sidebar;
