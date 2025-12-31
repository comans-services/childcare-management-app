import React, { useEffect } from "react";
import { Calendar, BarChart3, Users, Settings } from "lucide-react";
import { NavItem } from "./NavItem";
import { useNavigation } from "@/contexts/NavigationContext";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { useDeviceViewport } from "@/contexts/DeviceContext";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { bottomNavVisible } = useNavigation();
  const scrollDirection = useScrollDirection({ threshold: 50 });
  const { safeAreaInsets } = useDeviceViewport();

  // Calculate bottom padding for iOS safe area
  const bottomPadding = safeAreaInsets.bottom || 0;

  // Auto-hide/show based on scroll direction
  const shouldShow = bottomNavVisible && scrollDirection !== 'down';

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-white border-t border-gray-200",
        "transition-transform duration-300 ease-in-out",
        "md:hidden", // Only show on mobile
        shouldShow ? "translate-y-0" : "translate-y-full"
      )}
      style={{
        paddingBottom: `${bottomPadding}px`,
      }}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex justify-around items-center h-16">
        <NavItem
          icon={Calendar}
          label="Timesheet"
          to="/timesheet"
        />
        <NavItem
          icon={BarChart3}
          label="Reports"
          to="/timesheet/reports"
        />
        <NavItem
          icon={Users}
          label="Team"
          to="/timesheet/team"
        />
        <NavItem
          icon={Settings}
          label="Settings"
          to="/timesheet/settings"
        />
      </div>
    </nav>
  );
}
