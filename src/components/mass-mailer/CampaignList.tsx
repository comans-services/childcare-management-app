import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus, Edit, Trash2, Send, Eye } from "lucide-react";
import { CampaignForm } from "./CampaignForm";
import { CampaignStats } from "./CampaignStats";
import { fetchCampaigns, deleteCampaign, sendCampaign, type Campaign } from "@/lib/mass-mailer-service";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const CampaignList = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await fetchCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      await deleteCampaign(id);
      toast.success("Campaign deleted successfully");
      loadCampaigns();
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      toast.error(error.message || "Failed to delete campaign");
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm("Are you sure you want to send this campaign to all recipients?")) return;

    try {
      setSendingId(id);
      const result = await sendCampaign(id);
      if (result.success) {
        toast.success(result.message);
        loadCampaigns();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error("Error sending campaign:", error);
      toast.error("Failed to send campaign");
    } finally {
      setSendingId(null);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedCampaign(null);
    loadCampaigns();
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "sending":
        return <Badge variant="default">Sending</Badge>;
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Email Campaigns</h2>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No campaigns yet. Create your first campaign to get started.
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {campaign.subject}
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>{campaign.total_recipients || 0}</TableCell>
                    <TableCell>{campaign.total_sent || 0}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setStatsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {campaign.status === "draft" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSend(campaign.id)}
                              disabled={sendingId === campaign.id}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(campaign.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <CampaignForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
        onSuccess={handleFormSuccess}
      />

      {selectedCampaign && (
        <CampaignStats
          open={statsOpen}
          onOpenChange={setStatsOpen}
          campaignId={selectedCampaign.id}
          campaignSubject={selectedCampaign.subject}
        />
      )}
    </div>
  );
};
