import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { 
  Mail, 
  Users, 
  TrendingUp, 
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { getCampaignMetrics, getContactGrowthData, type CampaignMetrics, type ContactGrowthData } from "@/lib/mass-mailer-analytics-service";
import { ContactGrowthChart } from "./charts/ContactGrowthChart";
import { CampaignPerformanceChart } from "./charts/CampaignPerformanceChart";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [growthData, setGrowthData] = useState<ContactGrowthData[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsData, contactGrowth, campaigns] = await Promise.all([
        getCampaignMetrics(),
        getContactGrowthData(6),
        supabase
          .from("campaigns")
          .select("*")
          .order("sent_at", { ascending: false })
          .limit(10),
      ]);

      setMetrics(metricsData);
      setGrowthData(contactGrowth);
      setRecentActivities(campaigns.data || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-6 w-6 text-green-600" />;
    if (value < 0) return <ArrowDown className="h-6 w-6 text-red-600" />;
    return <Minus className="h-6 w-6 text-muted-foreground" />;
  };

  const getDeliveryRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 80) return "text-amber-500";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  const campaignData = growthData.map(item => ({
    month: item.month,
    campaigns: Math.floor(Math.random() * 10) + 1, // Placeholder - would come from real data
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Analytics Overview</h2>
        <p className="text-lg text-muted-foreground">
          Track your email campaign performance at a glance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-8 border-2">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="h-6 w-6 text-muted-foreground" />
            <span className="text-lg text-muted-foreground">Campaigns Sent</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-5xl font-bold text-foreground">
              {metrics?.totalCampaigns || 0}
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(metrics?.trendsVsLastMonth.campaigns || 0)}
              <span className="text-sm">
                {Math.abs(metrics?.trendsVsLastMonth.campaigns || 0).toFixed(0)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-8 border-2">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="text-lg text-muted-foreground">Successfully Delivered</span>
          </div>
          <div className="text-5xl font-bold text-foreground">
            {metrics?.totalDelivered?.toLocaleString() || 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            of {metrics?.totalEmailsSent?.toLocaleString() || 0} sent
          </p>
        </Card>

        <Card className="p-8 border-2">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-6 w-6 text-muted-foreground" />
            <span className="text-lg text-muted-foreground">People on Your List</span>
          </div>
          <div className="text-5xl font-bold text-foreground">
            {growthData[growthData.length - 1]?.totalContacts?.toLocaleString() || 0}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            +{growthData[growthData.length - 1]?.newContacts || 0} this month
          </p>
        </Card>

        <Card className="p-8 border-2">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
            <span className="text-lg text-muted-foreground">Email Success Rate</span>
          </div>
          <div className={`text-5xl font-bold ${getDeliveryRateColor(metrics?.averageDeliveryRate || 0)}`}>
            {metrics?.averageDeliveryRate?.toFixed(1) || 0}%
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Average delivery rate
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 border-2">
          <h3 className="text-2xl font-semibold mb-6">Contact Growth</h3>
          <ContactGrowthChart data={growthData} />
        </Card>

        <Card className="p-8 border-2">
          <h3 className="text-2xl font-semibold mb-6">Campaigns Sent</h3>
          <CampaignPerformanceChart data={campaignData} />
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-8 border-2">
        <h3 className="text-2xl font-semibold mb-6">Recent Campaign Activity</h3>
        <div className="space-y-4">
          {recentActivities.slice(0, 5).map((campaign) => (
            <Card key={campaign.id} className="p-6 border hover:border-primary transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-xl font-medium mb-2">{campaign.subject}</h4>
                  <div className="flex items-center gap-4 text-base text-muted-foreground">
                    <span>{campaign.total_recipients || 0} recipients</span>
                    <span>•</span>
                    <span>
                      {campaign.sent_at
                        ? formatDistanceToNow(new Date(campaign.sent_at), { addSuffix: true })
                        : "Not sent yet"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === "sent" && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Sent
                    </span>
                  )}
                  {campaign.status === "draft" && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      Draft
                    </span>
                  )}
                  {campaign.status === "scheduled" && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Scheduled
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};
