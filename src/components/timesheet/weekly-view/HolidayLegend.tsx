
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Shield, ShieldCheck, ShieldX } from "lucide-react";

const HolidayLegend: React.FC = () => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4" />
          <span className="font-medium text-sm">Holiday & Weekend Legend</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Holiday Indicators */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded"></div>
            <span>Holiday (Allowed)</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>Holiday (Blocked)</span>
          </div>
          
          {/* Weekend Indicators */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Weekend</span>
          </div>
          
          {/* Today Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary border border-primary rounded"></div>
            <span className="text-primary-foreground">Today</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-muted">
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="text-green-700 border-green-200">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Entry Allowed
            </Badge>
            <Badge variant="outline" className="text-red-700 border-red-200">
              <ShieldX className="h-3 w-3 mr-1" />
              Entry Blocked
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-200">
              <Shield className="h-3 w-3 mr-1" />
              Admin Override
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HolidayLegend;
