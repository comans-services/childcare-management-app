import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactList } from "@/components/mass-mailer/ContactList";
import { CampaignList } from "@/components/mass-mailer/CampaignList";
import { TemplateList } from "@/components/mass-mailer/TemplateList";
import { Mail, Users, FileText } from "lucide-react";

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
        <TabsList className="grid w-full max-w-2xl grid-cols-3 h-14">
          <TabsTrigger value="contacts" className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2 text-base">
            <Mail className="h-5 w-5" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-6">
          <ContactList />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <CampaignList />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplateList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MassMailerPage;
