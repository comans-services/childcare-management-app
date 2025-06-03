import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchUserById, updateUser, User } from "@/lib/user-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import PasswordChangeForm from "@/components/settings/PasswordChangeForm";

const SettingsPage = () => {
  const { user, userRole } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState({
    full_name: "",
    organization: "",
    time_zone: "",
    preferred_name: "",
    employment_type: "full-time" as "full-time" | "part-time",
    employee_card_id: "",
  });
  
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const userData = await fetchUserById(user.id);
        if (userData) {
          setProfile(userData);
          setFormState({
            full_name: userData.full_name || "",
            organization: userData.organization || "",
            time_zone: userData.time_zone || "",
            preferred_name: localStorage.getItem(`preferred-name-${user.id}`) || "",
            employment_type: userData.employment_type || "full-time",
            employee_card_id: userData.employee_card_id || "",
          });
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        toast({
          title: "Failed to load profile",
          description: "Could not load user profile information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserProfile();
  }, [user?.id]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "User not authenticated",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (formState.preferred_name) {
        localStorage.setItem(`preferred-name-${user.id}`, formState.preferred_name);
      } else {
        localStorage.removeItem(`preferred-name-${user.id}`);
      }
      
      const profileData: User = profile || { id: user.id };
      
      const updatedUser = await updateUser({
        ...profileData,
        full_name: formState.full_name,
        organization: formState.organization,
        time_zone: formState.time_zone,
        employment_type: formState.employment_type,
        employee_card_id: formState.employee_card_id,
      });
      
      setProfile(updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Failed to update profile",
        description: "There was an error updating your profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-28" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    Email cannot be changed.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formState.full_name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employee_card_id">Employee Card ID</Label>
                    <Input
                      id="employee_card_id"
                      name="employee_card_id"
                      value={formState.employee_card_id}
                      onChange={handleInputChange}
                      placeholder="EMP001"
                      disabled={userRole !== 'admin'}
                    />
                    {userRole !== 'admin' && (
                      <p className="text-sm text-muted-foreground">
                        Employee Card ID can only be changed by administrators.
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preferred_name">Preferred Name</Label>
                  <Input
                    id="preferred_name"
                    name="preferred_name"
                    value={formState.preferred_name}
                    onChange={handleInputChange}
                    placeholder="How you'd like to be addressed"
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be used in the app interface greeting.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userRole === 'admin' && (
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "Employee"}
                        disabled
                      />
                      <p className="text-sm text-muted-foreground">
                        Roles are managed by administrators.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="employment_type">Employment Type</Label>
                    <Select 
                      value={formState.employment_type} 
                      onValueChange={(value) => handleSelectChange("employment_type", value)}
                      disabled={userRole !== 'admin'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                      </SelectContent>
                    </Select>
                    {userRole !== 'admin' && (
                      <p className="text-sm text-muted-foreground">
                        Employment type can only be changed by administrators.
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      name="organization"
                      value={formState.organization}
                      onChange={handleInputChange}
                      placeholder="Your organization"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time_zone">Time Zone</Label>
                    <Select 
                      value={formState.time_zone} 
                      onValueChange={(value) => handleSelectChange("time_zone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Central European Time</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney (AEST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <PasswordChangeForm />
      </div>
    </div>
  );
};

export default SettingsPage;
