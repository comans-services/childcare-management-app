import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { emailTemplateService, EmailTemplate, NewEmailTemplate } from "@/lib/email-template-service";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message_body: z.string().min(1, "Message is required"),
  category: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: EmailTemplate;
  onSuccess: () => void;
}

export const TemplateForm = ({ open, onOpenChange, template, onSuccess }: TemplateFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      subject: "",
      message_body: "",
      category: "",
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description || "",
        subject: template.subject,
        message_body: template.message_body,
        category: template.category || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        subject: "",
        message_body: "",
        category: "",
      });
    }
  }, [template, form]);

  const onSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true);
    try {
      if (template) {
        await emailTemplateService.updateTemplate(template.id, data);
        toast({
          title: "Success",
          description: "Template updated successfully",
        });
      } else {
        await emailTemplateService.createTemplate(data as NewEmailTemplate);
        toast({
          title: "Success",
          description: "Template created successfully",
        });
      }
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {template ? "Edit Template" : "Create New Template"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Template Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-12 text-base" placeholder="e.g., Monthly Newsletter" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[80px] text-base" placeholder="What is this template for?" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Email Subject</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-12 text-base" placeholder="Subject line" />
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
                  <FormLabel className="text-lg">Email Message</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[200px] text-base" placeholder="Your email message..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-14 text-lg px-8 flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-14 text-lg px-8 flex-1 font-semibold"
              >
                {isSubmitting ? "Saving..." : template ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
