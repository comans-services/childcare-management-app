
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateUser, User } from "@/lib/user-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

export interface ProfileFormData {
  full_name: string;
  organization: string;
  time_zone: string;
  preferred_name: string;
  employee_id: string;
}

interface ProfileFormProps {
  profile: User | null;
  onProfileUpdate: (updatedUser: User) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, onProfileUpdate }) => {
  const { user, userRole } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<ProfileFormData>({
    full_name: profile?.full_name || "",
    organization: profile?.organization || "",
    time_zone: profile?.time_zone || "",
    preferred_name: localStorage.getItem(`preferred-name-${user?.id}`) || "",
    employee_id: profile?.employee_id || "",
  });

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
        employee_id: formState.employee_id,
      });

      onProfileUpdate(updatedUser);
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
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                name="employee_id"
                value={formState.employee_id}
                onChange={handleInputChange}
                placeholder="e.g., FIN001, EMP-2024-001"
                disabled={userRole !== 'admin'}
              />
              {userRole !== 'admin' ? (
                <p className="text-sm text-muted-foreground">
                  Employee ID can only be changed by administrators.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Employee ID for finance reporting and external systems.
                </p>
              )}
            </div>

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employment_type">Employment Type</Label>
              <Input
                id="employment_type"
                value={profile?.employment_type ? profile.employment_type.charAt(0).toUpperCase() + profile.employment_type.slice(1) : "Full-time"}
                disabled
              />
              <p className="text-sm text-muted-foreground">
                Employment type can only be changed by administrators in the Team page.
              </p>
            </div>
            
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
          
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
