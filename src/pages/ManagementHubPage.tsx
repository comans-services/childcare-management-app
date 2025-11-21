import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Mail, Baby } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ManagementHubPage = () => {
  const navigate = useNavigate();
  const { userRole, loading } = useAuth();

  const applications = [
    {
      id: "timesheet",
      title: "Timesheet",
      description: "Track and manage working hours, shifts, and time entries for all staff members",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      hoverColor: "hover:bg-blue-100",
      route: "/timesheet",
      available: true
    },
    {
      id: "mass-mailer",
      title: "Mass Mailer",
      description: "Send bulk emails and communications to parents, staff, and stakeholders",
      icon: Mail,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      hoverColor: "hover:bg-green-100",
      route: "/mass-mailer",
      available: true
    },
    {
      id: "childcare-monitor",
      title: "Childcare Monitor",
      description: "Monitor attendance, activities, and care records for all children",
      icon: Baby,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      hoverColor: "hover:bg-purple-100",
      route: "/childcare-monitor",
      available: true
    }
  ];

  const handleAppNavigation = (app: typeof applications[0]) => {
    if (app.available) {
      navigate(app.route);
    }
  };

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 pt-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
            Childcare Management Hub
          </h1>
          <p className="text-xl text-muted-foreground">
            Comprehensive management solution for childcare services
          </p>
        </div>

        {/* Description */}
        <div className="text-center mb-12">
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select an application to get started with timesheets, mass communications, or childcare monitoring
          </p>
        </div>

        {/* Application Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {applications.map((app) => {
            const IconComponent = app.icon;

            return (
              <Card
                key={app.id}
                className={`
                  relative overflow-hidden transition-all duration-300
                  ${app.available
                    ? `${app.borderColor} ${app.hoverColor} hover:shadow-lg hover:scale-105 cursor-pointer`
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  }
                  group border-2
                `}
                onClick={() => handleAppNavigation(app)}
              >
                <CardHeader className="pb-4">
                  <div className={`
                    w-16 h-16 rounded-full ${app.available ? app.bgColor : 'bg-gray-100'}
                    flex items-center justify-center mb-4 mx-auto
                    transition-transform duration-300 group-hover:scale-110
                  `}>
                    <IconComponent
                      className={`h-8 w-8 ${app.available ? app.color : 'text-gray-400'}`}
                    />
                  </div>
                  <CardTitle className={`text-xl text-center ${app.available ? 'text-gray-900' : 'text-gray-500'}`}>
                    {app.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0 pb-6">
                  <CardDescription className="text-center text-sm leading-relaxed mb-6">
                    {app.description}
                  </CardDescription>

                  <div className="flex justify-center">
                    <Button
                      className={`
                        w-full transition-all duration-300
                        ${app.available
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                        }
                      `}
                      disabled={!app.available}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppNavigation(app);
                      }}
                    >
                      {app.available ? 'Open App' : 'Coming Soon'}
                    </Button>
                  </div>
                </CardContent>

                {!app.available && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-gray-400 text-white text-xs px-2 py-1 rounded-full">
                      Coming Soon
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>© 2024 Childcare Management Hub. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default ManagementHubPage;
