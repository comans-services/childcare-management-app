
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, ClipboardCheck, Mail } from "lucide-react";

const HelpSection: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Need Help?</CardTitle>
        <CardDescription>Contact our team for assistance with different types of issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              App Function Issues
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Mia:</span>
                <a 
                  href="mailto:Maria.Sudianto@comansservices.com.au" 
                  className="text-blue-600 hover:underline"
                >
                  Maria.Sudianto@comansservices.com.au
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Chinh:</span>
                <a 
                  href="mailto:chinh@comansservices.com.au" 
                  className="text-blue-600 hover:underline"
                >
                  Chinh@comansservices.com.au
                </a>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-green-600" />
              Billing Issues
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Jason:</span>
                <a 
                  href="mailto:Jason.Comeau@comansservices.com.au" 
                  className="text-blue-600 hover:underline"
                >
                  Jason.Comeau@comansservices.com.au
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Belinda:</span>
                <a 
                  href="mailto:Belinda.Comeau@comansservices.com.au" 
                  className="text-blue-600 hover:underline"
                >
                  Belinda.Comeau@comansservices.com.au
                </a>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HelpSection;
