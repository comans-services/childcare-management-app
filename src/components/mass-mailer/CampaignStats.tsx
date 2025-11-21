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

  const chartData = stats
    ? [
        { name: "Sent", value: stats.total_sent, color: "hsl(217, 91%, 60%)" },
        { name: "Bounced", value: stats.total_bounced, color: "hsl(0, 72%, 51%)" },
        { name: "Unsubscribed", value: stats.total_unsubscribed, color: "hsl(var(--muted-foreground))" },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Campaign Statistics: {campaignSubject}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-lg text-muted-foreground">Loading statistics...</div>
        ) : (
          <div className="space-y-8">
            {stats && (
              <>
                {/* Key Metrics - Larger */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Card className="p-6 border-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-6 w-6 text-muted-foreground" />
                      <span className="text-base text-muted-foreground">Recipients</span>
                    </div>
                    <div className="text-4xl font-bold">{stats.total_recipients}</div>
                  </Card>

                  <Card className="p-6 border-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="h-6 w-6 text-green-600" />
                      <span className="text-base text-muted-foreground">Sent</span>
                    </div>
                    <div className="text-4xl font-bold">{stats.total_sent}</div>
                  </Card>

                  <Card className="p-6 border-2">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                      <span className="text-base text-muted-foreground">Bounced</span>
                    </div>
                    <div className="text-4xl font-bold">{stats.total_bounced}</div>
                  </Card>

                  <Card className="p-6 border-2">
                    <div className="flex items-center gap-2 mb-3">
                      <UserX className="h-6 w-6 text-muted-foreground" />
                      <span className="text-base text-muted-foreground">Unsubscribed</span>
                    </div>
                    <div className="text-4xl font-bold">{stats.total_unsubscribed}</div>
                  </Card>

                  <Card className="p-6 col-span-2 border-2">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                      <span className="text-base text-muted-foreground">Delivery Rate</span>
                    </div>
                    <div className={`text-4xl font-bold ${stats.delivery_rate >= 90 ? 'text-green-600' : stats.delivery_rate >= 80 ? 'text-amber-500' : 'text-red-600'}`}>
                      {stats.delivery_rate.toFixed(1)}%
                    </div>
                  </Card>

                  <Card className="p-6 col-span-2 border-2">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="h-6 w-6 text-destructive" />
                      <span className="text-base text-muted-foreground">Bounce Rate</span>
                    </div>
                    <div className="text-4xl font-bold">{stats.bounce_rate.toFixed(1)}%</div>
                  </Card>
                </div>

                {/* Event Breakdown Chart */}
                {chartData.length > 0 && (
                  <Card className="p-6 border-2">
                    <h3 className="text-xl font-semibold mb-4">Event Breakdown</h3>
                    <div className="h-[300px]">
                      {/* Placeholder for chart - would use EventBreakdownChart component */}
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Chart visualization coming soon
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Event Log - Card-based instead of table */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Event Log</h3>
              {events.length === 0 ? (
                <Card className="p-8 text-center border-2">
                  <p className="text-lg text-muted-foreground">No events yet</p>
                </Card>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {events.map((event) => (
                    <Card key={event.id} className="p-4 border hover:border-primary transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-lg font-medium">{event.contact_email}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {getEventBadge(event.event_type)}
                          <span className="text-base text-muted-foreground">
                            {formatDistanceToNow(new Date(event.event_timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
