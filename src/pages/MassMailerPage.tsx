import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactList } from "@/components/mass-mailer/ContactList";
import { CampaignList } from "@/components/mass-mailer/CampaignList";
import { Mail, Users } from "lucide-react";

const MassMailerPage = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Mass Mailer</h1>
        <p className="text-muted-foreground">
          Manage contacts and send email campaigns
        </p>
      </div>

      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-6">
          <ContactList />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <CampaignList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MassMailerPage;
