import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

export interface NavItemProps {
  icon: LucideIcon;
  label: string;
  to: string;
  badge?: number;
}

export function NavItem({ icon: Icon, label, to, badge }: NavItemProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current route matches this nav item
  const isActive = location.pathname.startsWith(to);

  const handleClick = () => {
    // Provide haptic feedback on tap
    haptics.light();
    navigate(to);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1",
        "min-w-touch min-h-touch",
        "px-3 py-2",
        "transition-colors duration-200",
        "relative",
        "active:scale-95 transition-transform",
        isActive
          ? "text-primary"
          : "text-gray-500 hover:text-gray-700"
      )}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="relative">
        <Icon
          className={cn(
            "w-6 h-6",
            isActive && "fill-primary/10"
          )}
        />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span
        className={cn(
          "text-xs font-medium",
          isActive && "font-semibold"
        )}
      >
        {label}
      </span>
    </button>
  );
}
