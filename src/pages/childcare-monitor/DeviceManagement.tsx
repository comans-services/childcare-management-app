import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deviceService } from "@/lib/childcare-monitor/device-service";
import { roomService } from "@/lib/childcare-monitor/room-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Copy, Power, PowerOff, ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
const DeviceManagement: React.FC = () => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [revokeDeviceId, setRevokeDeviceId] = useState<string | null>(null);
  const [reactivateDeviceId, setReactivateDeviceId] = useState<string | null>(null);
  const [deleteDeviceId, setDeleteDeviceId] = useState<string | null>(null);
  const [regenerateDeviceId, setRegenerateDeviceId] = useState<string | null>(null);
  const [regeneratedUrl, setRegeneratedUrl] = useState<string | null>(null);
  const {
    data: devices,
    isLoading: devicesLoading
  } = useQuery({
    queryKey: ["room-devices"],
    queryFn: () => deviceService.getAllDevices()
  });
  const {
    data: rooms,
    isLoading: roomsLoading
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomService.getRooms()
  });
  const generateTokenMutation = useMutation({
    mutationFn: ({
      roomId,
      deviceName
    }: {
      roomId: string;
      deviceName: string;
    }) => deviceService.generateDeviceToken(roomId, deviceName),
    onSuccess: data => {
      const setupUrl = `${window.location.origin}/childcare-monitor/setup?token=${data.token}`;
      setGeneratedToken(setupUrl);
      queryClient.invalidateQueries({
        queryKey: ["room-devices"]
      });
      toast({
        title: "Device registered",
        description: "Copy the setup URL to configure the iPad"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to register device",
        variant: "destructive"
      });
    }
  });
  const revokeDeviceMutation = useMutation({
    mutationFn: (deviceId: string) => deviceService.revokeDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["room-devices"]
      });
      toast({
        title: "Device revoked",
        description: "The device has been deactivated"
      });
      setRevokeDeviceId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke device",
        variant: "destructive"
      });
    }
  });
  const reactivateDeviceMutation = useMutation({
    mutationFn: (deviceId: string) => deviceService.reactivateDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["room-devices"]
      });
      toast({
        title: "Device reactivated",
        description: "The device has been activated"
      });
      setReactivateDeviceId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reactivate device",
        variant: "destructive"
      });
    }
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: (deviceId: string) => deviceService.deleteDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["room-devices"]
      });
      toast({
        title: "Device deleted",
        description: "The device has been permanently removed"
      });
      setDeleteDeviceId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete device",
        variant: "destructive"
      });
    }
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: (deviceId: string) => deviceService.regenerateDeviceToken(deviceId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["room-devices"]
      });
      const setupUrl = `${window.location.origin}/childcare-monitor/setup?token=${data.token}`;
      setRegeneratedUrl(setupUrl);
      toast({
        title: "Token regenerated",
        description: "Copy the new setup URL to configure a new iPad"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to regenerate token",
        variant: "destructive"
      });
    }
  });
  const handleRegisterDevice = () => {
    if (!newDeviceName.trim() || !selectedRoomId) {
      toast({
        title: "Error",
        description: "Please enter device name and select a room",
        variant: "destructive"
      });
      return;
    }
    generateTokenMutation.mutate({
      roomId: selectedRoomId,
      deviceName: newDeviceName.trim()
    });
  };
  const copySetupUrl = (url?: string) => {
    const urlToCopy = url || generatedToken;
    if (urlToCopy) {
      navigator.clipboard.writeText(urlToCopy);
      toast({
        title: "Copied!",
        description: "Setup URL copied to clipboard"
      });
    }
  };
  const closeRegisterDialog = () => {
    setShowRegisterDialog(false);
    setNewDeviceName("");
    setSelectedRoomId("");
    setGeneratedToken(null);
  };
  if (devicesLoading || roomsLoading) {
    return <div className="min-h-screen bg-care-green text-white p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>;
  }
  return <div className="min-h-screen bg-care-green text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/childcare-monitor" className="flex items-center gap-2 text-care-paleGreen">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Rooms</span>
          </Link>
        </div>

        <div className="bg-care-darkGreen rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">iPad Device Management</h1>
            <Button onClick={() => setShowRegisterDialog(true)} className="bg-care-accentGreen text-white">
              <Plus className="h-4 w-4 mr-2" />
              Register New iPad
            </Button>
          </div>

          <div className="space-y-4">
            {devices && devices.length > 0 ? devices.map(device => <div key={device.id} className="bg-care-lightGreen rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{device.device_name}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${device.is_active ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
                        {device.is_active ? "Active" : "Revoked"}
                      </span>
                    </div>
                    <p className="text-sm text-care-paleGreen mb-1">
                      Room: {device.room_name}
                    </p>
                    <p className="text-xs text-care-lightText">
                      Last seen:{" "}
                      {device.last_seen ? new Date(device.last_seen).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setRegenerateDeviceId(device.id)} size="sm" className="bg-blue-600 text-white" title="Regenerate Setup URL">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {device.is_active ? <Button onClick={() => setRevokeDeviceId(device.id)} size="sm" className="bg-red-600 text-white">
                        <PowerOff className="h-4 w-4 mr-2" />
                        Revoke
                      </Button> : <Button onClick={() => setReactivateDeviceId(device.id)} size="sm" className="bg-green-600 text-white">
                        <Power className="h-4 w-4 mr-2" />
                        Reactivate
                      </Button>}
                    <Button onClick={() => setDeleteDeviceId(device.id)} size="sm" className="bg-red-600 text-white">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>) : <div className="text-center py-8 text-care-lightText">
                No devices registered yet. Click "Register New iPad" to add one.
              </div>}
          </div>
        </div>
      </div>

      {/* Register Device Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={closeRegisterDialog}>
        <DialogContent className="bg-care-darkGreen text-white border-care-lightGreen">
          <DialogHeader>
            <DialogTitle>Register New iPad Device</DialogTitle>
            <DialogDescription className="text-care-lightText">
              {generatedToken ? "Copy the setup URL below and open it on the iPad" : "Enter device details to generate a setup URL"}
            </DialogDescription>
          </DialogHeader>

          {!generatedToken ? <div className="space-y-4">
              <div>
                <Label htmlFor="device-name">Device Name</Label>
                <Input id="device-name" placeholder="e.g., Wattle Room iPad" value={newDeviceName} onChange={e => setNewDeviceName(e.target.value)} className="bg-care-lightGreen border-care-accentGreen text-white placeholder:text-white" />
              </div>
              <div>
                <Label htmlFor="room-select">Room</Label>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger className="bg-care-lightGreen border-care-accentGreen text-white">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent className="bg-care-darkGreen border-care-accentGreen">
                    {rooms?.map(room => <SelectItem key={room.id} value={room.id} className="text-white">
                        {room.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div> : <div className="space-y-4">
              <div>
                <Label>Setup URL</Label>
                <div className="flex gap-2">
                  <Input value={generatedToken} readOnly className="bg-care-lightGreen border-care-accentGreen text-white" />
                  <Button onClick={() => copySetupUrl()} className="h-10 w-10 border border-care-accentGreen bg-transparent text-white p-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-care-paleGreen">
                Open this URL on the iPad to complete setup. The device will be locked to
                its assigned room.
              </p>
            </div>}

          <DialogFooter>
            <Button onClick={closeRegisterDialog} className="border border-care-accentGreen bg-transparent text-white">
              {generatedToken ? "Done" : "Cancel"}
            </Button>
            {!generatedToken && <Button onClick={handleRegisterDevice} disabled={generateTokenMutation.isPending} className="bg-care-accentGreen text-white">
                {generateTokenMutation.isPending ? <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </> : "Generate Setup URL"}
              </Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={revokeDeviceId !== null} onOpenChange={() => setRevokeDeviceId(null)}>
        <AlertDialogContent className="bg-care-darkGreen text-white border-care-lightGreen">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Device Access?</AlertDialogTitle>
            <AlertDialogDescription className="text-care-lightText">
              This will immediately deactivate the device. It will no longer be able to
              access the room monitor until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
          <AlertDialogCancel className="border-care-accentGreen text-white bg-transparent">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => revokeDeviceId && revokeDeviceMutation.mutate(revokeDeviceId)} className="bg-red-600 text-white">
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Confirmation */}
      <AlertDialog open={reactivateDeviceId !== null} onOpenChange={() => setReactivateDeviceId(null)}>
        <AlertDialogContent className="bg-care-darkGreen text-white border-care-lightGreen">
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Device?</AlertDialogTitle>
            <AlertDialogDescription className="text-care-lightText">
              This will allow the device to access the room monitor again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-care-accentGreen text-white bg-transparent">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => reactivateDeviceId && reactivateDeviceMutation.mutate(reactivateDeviceId)} className="bg-green-600 text-white">
              Reactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDeviceId !== null} onOpenChange={() => setDeleteDeviceId(null)}>
        <AlertDialogContent className="bg-care-darkGreen text-white border-care-lightGreen">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-care-lightText">
              This will permanently remove the device from the system. This action cannot be undone. 
              The iPad will need to be re-registered to access rooms again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-care-accentGreen text-white bg-transparent">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDeviceId && deleteDeviceMutation.mutate(deleteDeviceId)} className="bg-red-600 text-white">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate Token Dialog */}
      <AlertDialog open={regenerateDeviceId !== null} onOpenChange={(open) => {
        if (!open) {
          setRegenerateDeviceId(null);
          setRegeneratedUrl(null);
        }
      }}>
        <AlertDialogContent className="bg-care-darkGreen text-white border-care-lightGreen">
          <AlertDialogHeader>
            <AlertDialogTitle>{regeneratedUrl ? "New Setup URL Generated" : "Regenerate Setup URL?"}</AlertDialogTitle>
            <AlertDialogDescription className="text-care-lightText">
              {regeneratedUrl ? (
                <div className="space-y-4">
                  <p>Copy this URL and open it on the new iPad:</p>
                  <div className="flex gap-2">
                    <Input value={regeneratedUrl} readOnly className="bg-care-lightGreen border-care-accentGreen text-white" />
                    <Button onClick={() => copySetupUrl(regeneratedUrl)} className="h-10 w-10 border border-care-accentGreen bg-transparent text-white p-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs">The previous iPad will no longer have access.</p>
                </div>
              ) : (
                "This will generate a new setup URL and allow a different iPad to access this device. The current iPad will be disconnected."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-care-accentGreen text-white bg-transparent">
              {regeneratedUrl ? "Done" : "Cancel"}
            </AlertDialogCancel>
            {!regeneratedUrl && (
              <AlertDialogAction 
                onClick={() => regenerateDeviceId && regenerateTokenMutation.mutate(regenerateDeviceId)} 
                className="bg-blue-600 text-white"
                disabled={regenerateTokenMutation.isPending}
              >
                {regenerateTokenMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : "Regenerate"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default DeviceManagement;