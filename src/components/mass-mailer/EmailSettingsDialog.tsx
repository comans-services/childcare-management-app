import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const EmailSettingsDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: EmailSettingsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setSenderName(data.sender_name || "");
        setSenderEmail(data.sender_email || "");
        setReplyToEmail(data.reply_to_email || "");
        setOrganizationName(data.organization_name || "");
      }
    } catch (error) {
      console.error("Error loading email settings:", error);
      toast.error("Failed to load email settings");
    }
  };

  const handleSave = async () => {
    if (!senderName.trim()) {
      toast.error("Please enter a sender name");
      return;
    }
    if (!senderEmail.trim()) {
      toast.error("Please enter a sender email");
      return;
    }
    if (!replyToEmail.trim()) {
      toast.error("Please enter a reply-to email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      toast.error("Please enter a valid sender email address");
      return;
    }
    if (!emailRegex.test(replyToEmail)) {
      toast.error("Please enter a valid reply-to email address");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('email_settings')
        .update({
          sender_name: senderName.trim(),
          sender_email: senderEmail.trim(),
          reply_to_email: replyToEmail.trim(),
          organization_name: organizationName.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (await supabase.from('email_settings').select('id').single()).data?.id);

      if (error) throw error;

      toast.success("Email settings saved successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving email settings:", error);
      toast.error(error.message || "Failed to save email settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Settings className="h-6 w-6" />
            Email Settings
          </DialogTitle>
          <DialogDescription className="text-base">
            Configure your sender email and reply-to address. Recipients will see your
            name and can reply directly to your specified email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Domain Verification Warning */}
          <Alert>
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="text-base">
              <strong>Important:</strong> Your domain must be verified in Resend before
              emails will work.{" "}
              <a
                href="https://resend.com/domains"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                Verify domain at resend.com/domains
              </a>
            </AlertDescription>
          </Alert>

          {/* Sender Name */}
          <div className="space-y-3">
            <Label htmlFor="senderName" className="text-lg font-semibold">
              Sender Name *
            </Label>
            <Input
              id="senderName"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="DACCC"
              className="h-12 text-base"
            />
            <p className="text-sm text-muted-foreground">
              This name appears in the recipient's inbox
            </p>
          </div>

          {/* Sender Email */}
          <div className="space-y-3">
            <Label htmlFor="senderEmail" className="text-lg font-semibold">
              Sender Email *
            </Label>
            <Input
              id="senderEmail"
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="notifications@daccc.org.au"
              className="h-12 text-base"
            />
            <p className="text-sm text-muted-foreground">
              Must use a verified domain (e.g., @daccc.org.au)
            </p>
          </div>

          {/* Reply-To Email */}
          <div className="space-y-3">
            <Label htmlFor="replyToEmail" className="text-lg font-semibold">
              Reply-To Email *
            </Label>
            <Input
              id="replyToEmail"
              type="email"
              value={replyToEmail}
              onChange={(e) => setReplyToEmail(e.target.value)}
              placeholder="admin@daccc.org.au"
              className="h-12 text-base"
            />
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>When parents/staff reply to your emails, replies will go to this address</span>
            </div>
          </div>

          {/* Organization Name (Optional) */}
          <div className="space-y-3">
            <Label htmlFor="organizationName" className="text-lg font-semibold">
              Organization Name (Optional)
            </Label>
            <Input
              id="organizationName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="DACCC"
              className="h-12 text-base"
            />
            <p className="text-sm text-muted-foreground">
              Appears in the email footer
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-12 text-base"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="h-12 text-base px-6"
          >
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
