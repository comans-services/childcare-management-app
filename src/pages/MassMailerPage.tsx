import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleComposeEmail } from "@/components/mass-mailer/SimpleComposeEmail";
import { ContactList } from "@/components/mass-mailer/ContactList";
import { Mail, Users } from "lucide-react";

const MassMailerPage = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Mass Mailer</h1>
        <p className="text-xl text-muted-foreground">
          Send email notifications to parents and staff
        </p>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-16">
          <TabsTrigger value="send" className="flex items-center gap-2 text-lg">
            <Mail className="h-6 w-6" />
            Send Email
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2 text-lg">
            <Users className="h-6 w-6" />
            Contacts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="mt-6">
          <SimpleComposeEmail />
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <ContactList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MassMailerPage;
