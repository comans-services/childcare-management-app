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
import { Badge } from "@/components/ui/badge";
import { addContact, updateContact, getAllTags, type Contact } from "@/lib/mass-mailer-service";
import { toast } from "sonner";
import { X } from "lucide-react";

const contactSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  tags: z.string().optional(),
  email_consent: z.boolean(),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onSuccess: () => void;
}

export const ContactForm = ({ open, onOpenChange, contact, onSuccess }: ContactFormProps) => {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      tags: "",
      email_consent: true,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      // Fetch existing tags when form opens
      getAllTags().then(setAvailableTags).catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    if (contact) {
      const contactTags = Array.isArray(contact.tags) ? contact.tags : [];
      setSelectedTags(contactTags);
      form.reset({
        first_name: contact.first_name || "",
        last_name: contact.last_name || "",
        email: contact.email,
        tags: contactTags.join(", "),
        email_consent: contact.email_consent,
        notes: contact.notes || "",
      });
    } else {
      setSelectedTags([]);
      form.reset({
        first_name: "",
        last_name: "",
        email: "",
        tags: "",
        email_consent: true,
        notes: "",
      });
    }
  }, [contact, form, open]);

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      const newTags = [...selectedTags, trimmedTag];
      setSelectedTags(newTags);
      form.setValue("tags", newTags.join(", "));
      setTagInput("");
      setShowTagDropdown(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    form.setValue("tags", newTags.join(", "));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput);
      }
    }
  };

  const filteredTags = availableTags.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) && 
    !selectedTags.includes(tag)
  );

  const onSubmit = async (data: ContactFormData) => {
    try {
      const tags = data.tags
        ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      if (contact) {
        await updateContact(contact.id, {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          tags,
          email_consent: data.email_consent,
          notes: data.notes,
        });
        toast.success("Contact updated successfully");
      } else {
        await addContact({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          tags,
          email_consent: data.email_consent,
          notes: data.notes,
        });
        toast.success("Contact added successfully");
      }
      onSuccess();
    } catch (error: any) {
      console.error("Error saving contact:", error);
      toast.error(error.message || "Failed to save contact");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Contact" : "Add Contact"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {/* Selected tags as badges */}
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedTags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="h-11 px-4 text-base gap-2"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Tag input with dropdown */}
                      <div className="relative">
                        <Input
                          placeholder="Type to add or select tags..."
                          value={tagInput}
                          onChange={(e) => {
                            setTagInput(e.target.value);
                            setShowTagDropdown(true);
                          }}
                          onFocus={() => setShowTagDropdown(true)}
                          onKeyDown={handleTagInputKeyDown}
                          className="h-12 text-base"
                        />
                        
                        {/* Dropdown with existing tags */}
                        {showTagDropdown && (filteredTags.length > 0 || tagInput.trim()) && (
                          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredTags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleAddTag(tag)}
                                className="w-full text-left px-4 py-3 hover:bg-accent text-base transition-colors"
                              >
                                {tag}
                              </button>
                            ))}
                            {tagInput.trim() && !availableTags.includes(tagInput.trim()) && (
                              <button
                                type="button"
                                onClick={() => handleAddTag(tagInput)}
                                className="w-full text-left px-4 py-3 hover:bg-accent text-base border-t transition-colors"
                              >
                                + Add "<strong>{tagInput.trim()}</strong>" as new tag
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email_consent"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Email Consent</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Contact has agreed to receive emails
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {contact ? "Update" : "Add"} Contact
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
