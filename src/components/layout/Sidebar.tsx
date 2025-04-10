// src/components/layout/Sidebar.tsx
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
import Link from "next/link";
import { Home, Calendar, Users, Settings, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
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
          <Link href="/" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md">
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link href="/calendar" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md">
            <Calendar className="h-5 w-5" />
            <span>Calendar</span>
          </Link>
          <Link href="/customers" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md">
            <Users className="h-5 w-5" />
            <span>Customers</span>
          </Link>
          <Link href="/contracts" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md">
            <FileText className="h-5 w-5" />
            <span>Contracts</span>
          </Link>
        </div>
        <Separator className="my-4" />
        <div className="flex flex-col space-y-2">
          <Link href="/settings" className="flex items-center space-x-2 py-2 hover:bg-secondary rounded-md">
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
