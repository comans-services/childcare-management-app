
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateUser, User } from "@/lib/user-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export interface ProfileFormData {
  full_name: string;
  preferred_name: string;
  default_start_time: string;
  default_end_time: string;
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
    preferred_name: localStorage.getItem(`preferred-name-${user?.id}`) || "",
    default_start_time: profile?.default_start_time?.slice(0, 5) || "09:00",
    default_end_time: profile?.default_end_time?.slice(0, 5) || "17:00",
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
        default_start_time: formState.default_start_time,
        default_end_time: formState.default_end_time,
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
                disabled
              />
              <p className="text-sm text-muted-foreground">
                Full name can only be changed by an administrator.
              </p>
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

          <div className="space-y-4 pt-4 border-t">
            <div>
              <h3 className="text-lg font-medium">Default Work Times</h3>
              <p className="text-sm text-muted-foreground">
                These times will be pre-filled when you add a new shift.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_start_time">Default Start Time</Label>
                <Input
                  id="default_start_time"
                  name="default_start_time"
                  type="time"
                  value={formState.default_start_time}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_end_time">Default End Time</Label>
                <Input
                  id="default_end_time"
                  name="default_end_time"
                  type="time"
                  value={formState.default_end_time}
                  onChange={handleInputChange}
                />
              </div>
            </div>
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
