
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, Home } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "./MobileHeader";

const Header = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [displayName, setDisplayName] = useState<string>("");
  const isMobile = useIsMobile();

  // Check if we're in a sub-app (not on the main hub)
  const isInSubApp = location.pathname !== "/" && !location.pathname.startsWith("/auth");

  useEffect(() => {
    if (user?.id) {
      // Get preferred name from localStorage
      const preferredName = localStorage.getItem(`preferred-name-${user.id}`);

      // Set display name with fallback hierarchy: Preferred Name → Full Name → Email
      if (preferredName) {
        setDisplayName(preferredName);
      } else if (user.user_metadata?.full_name) {
        setDisplayName(user.user_metadata.full_name);
      } else {
        setDisplayName(user.email || "User");
      }
    }
  }, [user]);

  // Use mobile header on mobile devices
  if (isMobile) {
    return <MobileHeader />;
  }

  // Desktop header
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-blue-600">TimeTracker</h1>
          </div>

          {isInSubApp && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Hub
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <span className="text-sm text-gray-600">
              Hi, {displayName}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              signOut();
              navigate("/auth");
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
