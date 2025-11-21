import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { getCampaignStats, getCampaignEvents, type CampaignStats as Stats, type CampaignEvent } from "@/lib/mass-mailer-service";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, TrendingDown, Users, Mail, AlertCircle, UserX } from "lucide-react";

interface CampaignStatsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignSubject: string;
}

export const CampaignStats = ({ open, onOpenChange, campaignId, campaignSubject }: CampaignStatsProps) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && campaignId) {
      loadData();
    }
  }, [open, campaignId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, eventsData] = await Promise.all([
        getCampaignStats(campaignId),
        getCampaignEvents(campaignId),
      ]);
      setStats(statsData);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error loading campaign stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case "sent":
      case "test_sent":
        return <Badge variant="default">{type === "test_sent" ? "Test Sent" : "Sent"}</Badge>;
      case "delivered":
        return <Badge className="bg-green-600">Delivered</Badge>;
      case "bounced":
        return <Badge variant="destructive">Bounced</Badge>;
      case "unsubscribed":
        return <Badge variant="secondary">Unsubscribed</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Statistics: {campaignSubject}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading statistics...</div>
        ) : (
          <div className="space-y-6">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Recipients</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.total_recipients}</div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Sent</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.total_sent}</div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-muted-foreground">Bounced</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.total_bounced}</div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserX className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Unsubscribed</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.total_unsubscribed}</div>
                </Card>

                <Card className="p-4 col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-muted-foreground">Delivery Rate</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.delivery_rate.toFixed(1)}%</div>
                </Card>

                <Card className="p-4 col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-muted-foreground">Bounce Rate</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.bounce_rate.toFixed(1)}%</div>
                </Card>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-3">Event Log</h3>
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  No events yet
                </div>
              ) : (
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.contact_email}</TableCell>
                          <TableCell>{getEventBadge(event.event_type)}</TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(event.event_timestamp), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
