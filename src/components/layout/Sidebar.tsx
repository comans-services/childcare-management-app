
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
import { Home, Calendar, Users, Settings, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-64">
        <SheetHeader className="text-left">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navigate through your dashboard.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="flex flex-col space-y-2">
          <Link to="/" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2">
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link to="/timesheet" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2">
            <Calendar className="h-5 w-5" />
            <span>Timesheet</span>
          </Link>
          <Link to="/customers" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2">
            <Users className="h-5 w-5" />
            <span>Customers</span>
          </Link>
          <Link to="/contracts" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2">
            <FileText className="h-5 w-5" />
            <span>Contracts</span>
          </Link>
        </div>
        <Separator className="my-4" />
        <div className="flex flex-col space-y-2">
          <Link to="/settings" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md px-2">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
          <Button variant="ghost" className="justify-start" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
