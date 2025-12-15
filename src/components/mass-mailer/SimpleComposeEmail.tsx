import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RichTextEditor } from "./RichTextEditor";
import { Mail, Settings, Users, Paperclip } from "lucide-react";
import { fetchContacts, sendQuickEmail, type Contact } from "@/lib/mass-mailer-service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmailSettingsDialog } from "./EmailSettingsDialog";
import { FileAttachmentUpload, type EmailAttachment } from "./FileAttachmentUpload";

export const SimpleComposeEmail = () => {
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [emailSettings, setEmailSettings] = useState<any>(null);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);

  // Load contacts and settings
  useEffect(() => {
    loadContacts();
    loadEmailSettings();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await fetchContacts({ isActive: true, emailConsent: true });
      setContacts(data);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast.error("Failed to load contacts");
    }
  };

  const loadEmailSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .single();

      if (error) throw error;
      setEmailSettings(data);
    } catch (error) {
      console.error("Error loading email settings:", error);
    }
  };

  // Group contacts by tags
  const { allTags, groupedContacts } = useMemo(() => {
    const tagsSet = new Set<string>();
    const groups: Record<string, Contact[]> = { all: [] };

    contacts.forEach((contact) => {
      groups.all.push(contact);

      if (Array.isArray(contact.tags) && contact.tags.length > 0) {
        contact.tags.forEach((tag: string) => {
          tagsSet.add(tag);
          if (!groups[tag]) groups[tag] = [];
          groups[tag].push(contact);
        });
      }
    });

    return {
      allTags: Array.from(tagsSet).sort(),
      groupedContacts: groups,
    };
  }, [contacts]);

  const recipientCount = groupedContacts[selectedGroup]?.length || 0;

  const handleSendClick = () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!messageBody.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (recipientCount === 0) {
      toast.error("No recipients selected");
      return;
    }
    setShowConfirmation(true);
  };

  const handleSendConfirm = async () => {
    setShowConfirmation(false);
    setLoading(true);

    try {
      const result = await sendQuickEmail(subject, messageBody, selectedGroup, attachments);
      
      toast.success(
        `Email sent successfully to ${result.sent} recipient${result.sent !== 1 ? 's' : ''}!`
      );

      if (result.failed > 0) {
        toast.warning(`${result.failed} email${result.failed !== 1 ? 's' : ''} failed to send`);
      }

      // Reset form
      setSubject("");
      setMessageBody("");
      setSelectedGroup("all");
      setAttachments([]);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const groupName = selectedGroup === "all" ? "All Contacts" : selectedGroup;

  return (
    <>
      <Card className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Send Email</h2>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowSettings(true)}
            className="h-14 px-6"
          >
            <Settings className="h-5 w-5 mr-2" />
            <span className="text-lg">Settings</span>
          </Button>
        </div>

        <div className="space-y-6">
          {/* From Field (Read-only) */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">From:</Label>
            <div className="h-14 px-4 rounded-md border border-input bg-muted flex items-center text-lg text-muted-foreground">
              {emailSettings
                ? `${emailSettings.sender_name} <${emailSettings.sender_email}>`
                : "Loading sender info..."}
            </div>
            {emailSettings && emailSettings.reply_to_email && (
              <p className="text-sm text-muted-foreground">
                Replies will go to: {emailSettings.reply_to_email}
              </p>
            )}
          </div>

          {/* To Field (Group Selection) */}
          <div className="space-y-3">
            <Label htmlFor="group" className="text-lg font-semibold">
              To:
            </Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger id="group" className="h-14 text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-lg py-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Contacts ({groupedContacts.all?.length || 0})
                  </div>
                </SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag} className="text-lg py-3">
                    {tag} ({groupedContacts[tag]?.length || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Field */}
          <div className="space-y-3">
            <Label htmlFor="subject" className="text-lg font-semibold">
              Subject:
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="h-14 text-lg"
            />
          </div>

          {/* Message Body */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Message:</Label>
            <RichTextEditor
              content={messageBody}
              onChange={setMessageBody}
              className="min-h-[300px]"
            />
          </div>

          {/* File Attachments */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Attachments:
            </Label>
            <FileAttachmentUpload
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              maxFiles={5}
              maxSizePerFile={10 * 1024 * 1024}
            />
          </div>

          {/* Recipient Count and Send Button */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-5 w-5" />
              <span className="text-lg">
                {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} will receive this email
              </span>
            </div>
            <Button
              size="lg"
              onClick={handleSendClick}
              disabled={loading || recipientCount === 0}
              className="h-14 px-8 text-lg"
            >
              <Mail className="h-5 w-5 mr-2" />
              {loading ? "Sending..." : "Send Email Now"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">Confirm Send Email</AlertDialogTitle>
            <AlertDialogDescription className="text-lg space-y-2">
              <p>
                Are you sure you want to send this email to <strong>{recipientCount}</strong>{" "}
                {recipientCount === 1 ? "recipient" : "recipients"} in{" "}
                <strong>{groupName}</strong>?
              </p>
              <p className="font-semibold">Subject: {subject}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 text-base">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendConfirm}
              className="h-12 text-base"
            >
              Yes, Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Settings Dialog */}
      <EmailSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        onSuccess={loadEmailSettings}
      />
    </>
  );
};
