
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";

const Header = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Clock className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-blue-600">TimeTracker</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <span className="text-sm text-gray-600">
              Hi, {user.user_metadata?.full_name || user.email}
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
