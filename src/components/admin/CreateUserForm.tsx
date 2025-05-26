
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { createUserAsAdmin, AdminCreateUserData } from "@/lib/admin-user-service";
import { useQueryClient } from "@tanstack/react-query";

const CreateUserForm = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "staff" as "admin" | "staff",
    organization: "Comans Services",
    time_zone: "Australia/Sydney",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const userData: AdminCreateUserData = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
        organization: formData.organization,
        time_zone: formData.time_zone,
      };
      
      await createUserAsAdmin(userData);
      
      toast({
        title: "User created successfully",
        description: `${formData.full_name || formData.email} has been added to the system`,
      });
      
      // Reset form
      setFormData({
        email: "",
        password: "",
        full_name: "",
        role: "staff",
        organization: "Comans Services",
        time_zone: "Australia/Sydney",
      });
      
      // Refresh user list
      queryClient.invalidateQueries({ queryKey: ["users"] });
      
    } catch (error: any) {
      toast({
        title: "Error creating user",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickCreateChinh = async () => {
    setIsCreating(true);
    
    try {
      const userData: AdminCreateUserData = {
        email: "chinh@comansservices.com.au",
        password: "110805Zz",
        full_name: "Chinh",
        role: "staff",
        organization: "Comans Services",
        time_zone: "Australia/Sydney",
      };
      
      await createUserAsAdmin(userData);
      
      toast({
        title: "User created successfully",
        description: "Chinh has been added to the system with staff access",
      });
      
      // Refresh user list
      queryClient.invalidateQueries({ queryKey: ["users"] });
      
    } catch (error: any) {
      toast({
        title: "Error creating user",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Create Button for Chinh */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Create User</CardTitle>
          <CardDescription>
            Create the requested user with predefined settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleQuickCreateChinh}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? "Creating..." : "Create chinh@comansservices.com.au"}
          </Button>
        </CardContent>
      </Card>

      {/* Manual Create Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>
            Add a new user to the system with admin approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as "admin" | "staff" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="time_zone">Time Zone</Label>
                <Select
                  value={formData.time_zone}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, time_zone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                    <SelectItem value="Australia/Melbourne">Melbourne (AEST)</SelectItem>
                    <SelectItem value="Australia/Perth">Perth (AWST)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isCreating} className="w-full">
              {isCreating ? "Creating User..." : "Create User"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateUserForm;
