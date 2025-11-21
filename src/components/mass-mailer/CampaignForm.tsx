import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCampaign, updateCampaign, sendTestEmail, getAllTags, type Campaign } from "@/lib/mass-mailer-service";
import { toast } from "sonner";
import { Send } from "lucide-react";

const campaignSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message_body: z.string().min(1, "Message is required"),
  audience_filter: z.enum(["all", "tags"]),
  target_tag: z.string().optional(),
  footer_included: z.boolean(),
  unsubscribe_link_included: z.boolean(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  onSuccess: () => void;
}

export const CampaignForm = ({ open, onOpenChange, campaign, onSuccess }: CampaignFormProps) => {
  const [tags, setTags] = useState<string[]>([]);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      subject: "",
      message_body: "",
      audience_filter: "all",
      target_tag: "",
      footer_included: true,
      unsubscribe_link_included: true,
    },
  });

  const audienceFilter = form.watch("audience_filter");

  useEffect(() => {
    const loadTags = async () => {
      const allTags = await getAllTags();
      setTags(allTags);
    };
    loadTags();
  }, []);

  useEffect(() => {
    if (campaign) {
      form.reset({
        subject: campaign.subject,
        message_body: campaign.message_body,
        audience_filter: (campaign.audience_filter as "all" | "tags") || "all",
        target_tag: campaign.target_tag || "",
        footer_included: campaign.footer_included,
        unsubscribe_link_included: campaign.unsubscribe_link_included,
      });
    } else {
      form.reset({
        subject: "",
        message_body: "",
        audience_filter: "all",
        target_tag: "",
        footer_included: true,
        unsubscribe_link_included: true,
      });
    }
  }, [campaign, form]);

  const onSubmit = async (data: CampaignFormData) => {
    try {
      if (campaign) {
        await updateCampaign(campaign.id, {
          subject: data.subject,
          message_body: data.message_body,
          audience_filter: data.audience_filter,
          target_tag: data.target_tag,
          footer_included: data.footer_included,
          unsubscribe_link_included: data.unsubscribe_link_included,
        });
        toast.success("Campaign updated successfully");
      } else {
        await createCampaign({
          subject: data.subject,
          message_body: data.message_body,
          audience_filter: data.audience_filter,
          target_tag: data.target_tag,
          footer_included: data.footer_included,
          unsubscribe_link_included: data.unsubscribe_link_included,
        });
        toast.success("Campaign created successfully");
      }
      onSuccess();
    } catch (error: any) {
      console.error("Error saving campaign:", error);
      toast.error(error.message || "Failed to save campaign");
    }
  };

  const handleSendTest = async () => {
    if (!campaign || !testEmail) {
      toast.error("Please provide a test email address");
      return;
    }

    try {
      setSendingTest(true);
      const result = await sendTestEmail(campaign.id, testEmail);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your email subject line" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message_body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Your email message (HTML supported)"
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="audience_filter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audience</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Contacts</SelectItem>
                      <SelectItem value="tags">Specific Tag</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {audienceFilter === "tags" && (
              <FormField
                control={form.control}
                name="target_tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Tag</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tag" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tags.map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            {tag}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="footer_included"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Include Footer</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unsubscribe_link_included"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Include Unsubscribe Link</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {campaign && (
              <div className="pt-4 border-t space-y-2">
                <FormLabel>Send Test Email</FormLabel>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendTest}
                    disabled={sendingTest}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendingTest ? "Sending..." : "Send Test"}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {campaign ? "Update" : "Create"} Campaign
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
