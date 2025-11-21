import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Upload, Download, Edit, Trash2 } from "lucide-react";
import { ContactForm } from "./ContactForm";
import { CSVImportDialog } from "./CSVImportDialog";
import { fetchContacts, deleteContact, exportContactsToCSV, type Contact } from "@/lib/mass-mailer-service";
import { toast } from "sonner";

export const ContactList = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await fetchContacts({
        searchTerm: searchTerm || undefined,
        isActive: true,
      });
      setContacts(data);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      await deleteContact(id);
      toast.success("Contact deleted successfully");
      loadContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportContactsToCSV({ isActive: true });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Contacts exported successfully");
    } catch (error) {
      console.error("Error exporting contacts:", error);
      toast.error("Failed to export contacts");
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedContact(null);
    loadContacts();
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsImportOpen(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No contacts found. Add your first contact to get started.
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Email Consent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.full_name || "—"}
                    </TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {Array.isArray(contact.tags) && contact.tags.length > 0 ? (
                          contact.tags.map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No tags</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.email_consent ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="destructive">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedContact(contact);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <ContactForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedContact(null);
        }}
        contact={selectedContact}
        onSuccess={handleFormSuccess}
      />

      <CSVImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={loadContacts}
      />
    </div>
  );
};
