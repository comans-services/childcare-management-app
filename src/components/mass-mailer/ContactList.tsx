import { useState, useEffect, useMemo } from "react";
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
import { Plus, Search, Upload, Download, Edit, Trash2, Users, Tag } from "lucide-react";
import { ContactForm } from "./ContactForm";
import { CSVImportDialog } from "./CSVImportDialog";
import { fetchContacts, deleteContact, exportContactsToCSV, type Contact } from "@/lib/mass-mailer-service";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const ContactList = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  // Extract unique tags from all contacts and group contacts by tag
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
      } else {
        if (!groups["untagged"]) groups["untagged"] = [];
        groups["untagged"].push(contact);
      }
    });

    return {
      allTags: Array.from(tagsSet).sort(),
      groupedContacts: groups,
    };
  }, [contacts]);

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

  const currentContacts = groupedContacts[selectedGroup] || [];

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setIsImportOpen(true)} variant="outline" size="lg">
              <Upload className="h-5 w-5 mr-2" />
              Import CSV
            </Button>
            <Button onClick={handleExport} variant="outline" size="lg">
              <Download className="h-5 w-5 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setIsFormOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
      </Card>

      {/* Groups/Tags Navigation */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Groups</h2>
        </div>
        
        <Tabs value={selectedGroup} onValueChange={setSelectedGroup} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 h-auto p-2">
            <TabsTrigger value="all" className="h-12 text-base">
              <Users className="h-4 w-4 mr-2" />
              All ({groupedContacts.all?.length || 0})
            </TabsTrigger>
            
            {allTags.map((tag) => (
              <TabsTrigger key={tag} value={tag} className="h-12 text-base">
                <Tag className="h-4 w-4 mr-2" />
                {tag} ({groupedContacts[tag]?.length || 0})
              </TabsTrigger>
            ))}
            
            {groupedContacts.untagged && groupedContacts.untagged.length > 0 && (
              <TabsTrigger value="untagged" className="h-12 text-base">
                <Users className="h-4 w-4 mr-2" />
                Untagged ({groupedContacts.untagged.length})
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </Card>

      {/* Contacts Table */}
      <Card className="p-6">

        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            {selectedGroup === "all" 
              ? "All Contacts" 
              : selectedGroup === "untagged"
              ? "Untagged Contacts"
              : `Group: ${selectedGroup}`}
          </h3>
          <p className="text-muted-foreground">
            Showing {currentContacts.length} contact{currentContacts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-lg">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            Loading contacts...
          </div>
        ) : currentContacts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-lg">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            {selectedGroup === "all" 
              ? "No contacts found. Add your first contact to get started."
              : `No contacts in this group.`}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-12 text-base font-semibold">Name</TableHead>
                  <TableHead className="h-12 text-base font-semibold">Email</TableHead>
                  <TableHead className="h-12 text-base font-semibold">Tags</TableHead>
                  <TableHead className="h-12 text-base font-semibold">Consent</TableHead>
                  <TableHead className="h-12 text-base font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentContacts.map((contact) => (
                  <TableRow key={contact.id} className="h-16">
                    <TableCell className="font-medium text-base">
                      {contact.full_name || "—"}
                    </TableCell>
                    <TableCell className="text-base">{contact.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {Array.isArray(contact.tags) && contact.tags.length > 0 ? (
                          contact.tags.map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-sm px-2 py-1">
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
                        <Badge variant="default" className="text-sm px-3 py-1">Yes</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-sm px-3 py-1">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="lg"
                          variant="ghost"
                          onClick={() => {
                            setSelectedContact(contact);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          size="lg"
                          variant="ghost"
                          onClick={() => handleDelete(contact.id)}
                        >
                          <Trash2 className="h-5 w-5" />
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
