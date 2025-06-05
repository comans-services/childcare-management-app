
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mail, Phone } from "lucide-react";

const HelpAndSupport: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Help & Support
        </CardTitle>
        <CardDescription>Need assistance? We're here to help</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Support
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Call Support
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HelpAndSupport;
