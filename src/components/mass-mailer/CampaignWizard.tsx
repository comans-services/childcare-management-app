import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { createCampaign, getAllTags, sendTestEmail } from "@/lib/mass-mailer-service";
import { Campaign } from "@/lib/mass-mailer-service";
import { SchedulePicker } from "./SchedulePicker";
import { RichTextEditor } from "./RichTextEditor";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, FileText } from "lucide-react";
import { TemplateList } from "./TemplateList";
import { EmailTemplate } from "@/lib/email-template-service";

const campaignSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message_body: z.string().min(1, "Message is required"),
  audience_filter: z.enum(["all", "tag"]),
  target_tag: z.string().optional(),
  footer_included: z.boolean().default(true),
  unsubscribe_link_included: z.boolean().default(true),
  send_timing: z.enum(["now", "scheduled"]),
  scheduled_for: z.date().optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign;
  onSuccess: () => void;
}

export const CampaignWizard = ({ open, onOpenChange, campaign, onSuccess }: CampaignWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [editorMode, setEditorMode] = useState<"plain" | "rich">("plain");
  const [showTemplates, setShowTemplates] = useState(false);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      subject: "",
      message_body: "",
      audience_filter: "all",
      target_tag: "",
      footer_included: true,
      unsubscribe_link_included: true,
      send_timing: "now",
      scheduled_for: undefined,
    },
  });

  useEffect(() => {
    const loadTags = async () => {
      const availableTags = await getAllTags();
      setTags(availableTags);
    };
    loadTags();
  }, []);

  const handleTemplateSelect = (template: EmailTemplate) => {
    form.setValue("subject", template.subject);
    form.setValue("message_body", template.message_body);
    setShowTemplates(false);
    toast({
      title: "Template applied",
      description: "The template has been applied to your campaign",
    });
  };

  const onSubmit = async (data: CampaignFormData) => {
    setIsSubmitting(true);
    try {
      const campaignData: any = {
        subject: data.subject,
        message_body: data.message_body,
        audience_filter: data.audience_filter,
        target_tag: data.target_tag,
        footer_included: data.footer_included,
        unsubscribe_link_included: data.unsubscribe_link_included,
        scheduled_for: data.send_timing === "scheduled" ? data.scheduled_for?.toISOString() : undefined,
        status: data.send_timing === "scheduled" ? "scheduled" : "draft",
      };

      await createCampaign(campaignData);
      
      toast({
        title: "Success",
        description: data.send_timing === "scheduled" 
          ? "Campaign scheduled successfully"
          : "Campaign created successfully",
      });
      
      onSuccess();
      onOpenChange(false);
      form.reset();
      setCurrentStep(1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const steps = [
    { number: 1, title: "Email Content" },
    { number: 2, title: "Who to Send To" },
    { number: 3, title: "When to Send" },
    { number: 4, title: "Review & Send" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Email Campaign</DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex justify-between mb-8">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                    currentStep >= step.number
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.number ? <Check className="h-6 w-6" /> : step.number}
                </div>
                <span className="text-sm mt-2 text-center">{step.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    currentStep > step.number ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Email Content */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="h-12 text-base"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  {showTemplates ? "Hide Templates" : "Start from Template"}
                </Button>

                {showTemplates && (
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                    <TemplateList onSelectTemplate={handleTemplateSelect} selectionMode />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Email Subject</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-14 text-base" placeholder="Enter subject line" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <label className="text-lg font-medium mb-3 block">Message Editor</label>
                  <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as "plain" | "rich")}>
                    <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
                      <TabsTrigger value="plain" className="text-base">Simple Text</TabsTrigger>
                      <TabsTrigger value="rich" className="text-base">Rich Text</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="message_body"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            {editorMode === "plain" ? (
                              <Textarea
                                {...field}
                                className="min-h-[300px] text-base"
                                placeholder="Type your email message..."
                              />
                            ) : (
                              <RichTextEditor
                                content={field.value}
                                onChange={field.onChange}
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Audience */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="audience_filter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Who should receive this email?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-4"
                        >
                          <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                            <RadioGroupItem value="all" id="all" className="h-6 w-6" />
                            <label htmlFor="all" className="text-base font-medium cursor-pointer flex-1">
                              All Contacts
                            </label>
                          </div>
                          <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                            <RadioGroupItem value="tag" id="tag" className="h-6 w-6" />
                            <label htmlFor="tag" className="text-base font-medium cursor-pointer flex-1">
                              Contacts with Specific Tag
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("audience_filter") === "tag" && (
                  <FormField
                    control={form.control}
                    name="target_tag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">Select Tag</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 text-base">
                              <SelectValue placeholder="Choose a tag" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tags.map((tag) => (
                              <SelectItem key={tag} value={tag} className="text-base">
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

                <div className="p-6 bg-muted rounded-lg">
                  <p className="text-lg">
                    <span className="font-semibold">This will send to approximately:</span>{" "}
                    <span className="text-2xl font-bold text-primary">{recipientCount || "all"}</span> people
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Timing */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="send_timing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">When should this email be sent?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-4"
                        >
                          <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                            <RadioGroupItem value="now" id="now" className="h-6 w-6" />
                            <label htmlFor="now" className="text-base font-medium cursor-pointer flex-1">
                              🚀 Send Now
                            </label>
                          </div>
                          <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                            <RadioGroupItem value="scheduled" id="scheduled" className="h-6 w-6" />
                            <label htmlFor="scheduled" className="text-base font-medium cursor-pointer flex-1">
                              📅 Schedule for Later
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("send_timing") === "scheduled" && (
                  <FormField
                    control={form.control}
                    name="scheduled_for"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <SchedulePicker value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-muted p-6 rounded-lg space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">✉️ Email Subject</h3>
                    <p className="text-base">{form.watch("subject") || "No subject"}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">👥 Recipients</h3>
                    <p className="text-base">
                      {form.watch("audience_filter") === "all" 
                        ? "All contacts" 
                        : `Contacts with tag: ${form.watch("target_tag")}`}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">📅 Send Time</h3>
                    <p className="text-base">
                      {form.watch("send_timing") === "now" 
                        ? "Send immediately" 
                        : form.watch("scheduled_for") 
                          ? format(form.watch("scheduled_for")!, "EEEE, MMMM d, yyyy 'at' h:mm a")
                          : "Not scheduled"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">📝 Message Preview</h3>
                    <div className="bg-background p-4 rounded border max-h-48 overflow-y-auto">
                      <div className="text-base" dangerouslySetInnerHTML={{ __html: form.watch("message_body") }} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="footer_included"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4 flex-1">
                        <div>
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
                      <FormItem className="flex items-center justify-between rounded-lg border p-4 flex-1">
                        <div>
                          <FormLabel className="text-base">Unsubscribe Link</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="h-14 text-lg px-8 flex-1"
                >
                  Back
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="h-14 text-lg px-8 flex-1 font-semibold"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-14 text-lg px-8 flex-1 font-semibold"
                >
                  {isSubmitting 
                    ? "Creating..." 
                    : form.watch("send_timing") === "scheduled" 
                      ? "Schedule Campaign" 
                      : "Create Campaign"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
