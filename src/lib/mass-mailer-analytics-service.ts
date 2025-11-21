import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface CampaignMetrics {
  totalCampaigns: number;
  totalEmailsSent: number;
  totalDelivered: number;
  averageDeliveryRate: number;
  totalBounced: number;
  totalUnsubscribed: number;
  averageBounceRate: number;
  trendsVsLastMonth: {
    campaigns: number;
    deliveryRate: number;
  };
}

export interface ContactGrowthData {
  month: string;
  newContacts: number;
  totalContacts: number;
}

export interface EngagementStats {
  activeConsented: number;
  activeNotConsented: number;
  inactive: number;
  unsubscribed: number;
  totalContacts: number;
}

export interface TagAnalytics {
  tag: string;
  count: number;
}

export interface TopCampaign {
  id: string;
  subject: string;
  sent_at: string;
  delivery_rate: number;
  total_sent: number;
  total_delivered: number;
}

export interface BounceAnalysis {
  reason: string;
  count: number;
}

export interface CampaignComparison {
  id: string;
  subject: string;
  sent_at: string;
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  total_unsubscribed: number;
  delivery_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  success_score: number;
}

export const getCampaignMetrics = async (
  startDate?: Date,
  endDate?: Date
): Promise<CampaignMetrics> => {
  const now = new Date();
  const start = startDate || new Date(0);
  const end = endDate || now;

  // Get campaigns in date range
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("*")
    .gte("sent_at", start.toISOString())
    .lte("sent_at", end.toISOString())
    .eq("status", "sent");

  if (campaignsError) throw campaignsError;

  const totalCampaigns = campaigns?.length || 0;
  const totalEmailsSent = campaigns?.reduce((sum, c) => sum + (c.total_sent || 0), 0) || 0;
  
  // Calculate delivered from sent - bounced
  const totalBounced = campaigns?.reduce((sum, c) => sum + (c.total_bounced || 0), 0) || 0;
  const totalDelivered = totalEmailsSent - totalBounced;
  const totalUnsubscribed = campaigns?.reduce((sum, c) => sum + (c.total_unsubscribed || 0), 0) || 0;

  const averageDeliveryRate = totalEmailsSent > 0 ? (totalDelivered / totalEmailsSent) * 100 : 0;
  const averageBounceRate = totalEmailsSent > 0 ? (totalBounced / totalEmailsSent) * 100 : 0;

  // Get last month's metrics for comparison
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const { data: lastMonthCampaigns } = await supabase
    .from("campaigns")
    .select("*")
    .gte("sent_at", lastMonthStart.toISOString())
    .lte("sent_at", lastMonthEnd.toISOString())
    .eq("status", "sent");

  const lastMonthTotal = lastMonthCampaigns?.length || 0;
  const lastMonthSent = lastMonthCampaigns?.reduce((sum, c) => sum + (c.total_sent || 0), 0) || 0;
  const lastMonthBounced = lastMonthCampaigns?.reduce((sum, c) => sum + (c.total_bounced || 0), 0) || 0;
  const lastMonthDelivered = lastMonthSent - lastMonthBounced;
  const lastMonthDeliveryRate = lastMonthSent > 0 ? (lastMonthDelivered / lastMonthSent) * 100 : 0;

  const campaignsTrend = lastMonthTotal > 0 
    ? ((totalCampaigns - lastMonthTotal) / lastMonthTotal) * 100 
    : 0;
  const deliveryRateTrend = lastMonthDeliveryRate > 0 
    ? averageDeliveryRate - lastMonthDeliveryRate 
    : 0;

  return {
    totalCampaigns,
    totalEmailsSent,
    totalDelivered,
    averageDeliveryRate,
    totalBounced,
    totalUnsubscribed,
    averageBounceRate,
    trendsVsLastMonth: {
      campaigns: campaignsTrend,
      deliveryRate: deliveryRateTrend,
    },
  };
};

export const getContactGrowthData = async (months: number = 6): Promise<ContactGrowthData[]> => {
  const data: ContactGrowthData[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const { data: newContacts } = await supabase
      .from("contacts")
      .select("id", { count: "exact" })
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString());

    const { data: totalContacts } = await supabase
      .from("contacts")
      .select("id", { count: "exact" })
      .lte("created_at", monthEnd.toISOString());

    data.push({
      month: format(monthDate, "MMM yyyy"),
      newContacts: newContacts?.length || 0,
      totalContacts: totalContacts?.length || 0,
    });
  }

  return data;
};

export const getEngagementStats = async (): Promise<EngagementStats> => {
  const { data: allContacts } = await supabase
    .from("contacts")
    .select("is_active, email_consent");

  const activeConsented = allContacts?.filter(c => c.is_active && c.email_consent).length || 0;
  const activeNotConsented = allContacts?.filter(c => c.is_active && !c.email_consent).length || 0;
  const inactive = allContacts?.filter(c => !c.is_active).length || 0;

  const { data: unsubscribes } = await supabase
    .from("unsubscribes")
    .select("email", { count: "exact" });

  return {
    activeConsented,
    activeNotConsented,
    inactive,
    unsubscribed: unsubscribes?.length || 0,
    totalContacts: allContacts?.length || 0,
  };
};

export const getTagAnalytics = async (): Promise<TagAnalytics[]> => {
  const { data: contacts } = await supabase
    .from("contacts")
    .select("tags");

  const tagCounts: Record<string, number> = {};

  contacts?.forEach(contact => {
    if (contact.tags && Array.isArray(contact.tags)) {
      contact.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

export const getTopCampaigns = async (limit: number = 5): Promise<TopCampaign[]> => {
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, subject, sent_at, total_sent, total_bounced")
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(50);

  if (!campaigns) return [];

  const campaignsWithRates = campaigns
    .map(c => {
      const totalDelivered = (c.total_sent || 0) - (c.total_bounced || 0);
      const deliveryRate = c.total_sent > 0 ? (totalDelivered / c.total_sent) * 100 : 0;
      
      return {
        id: c.id,
        subject: c.subject,
        sent_at: c.sent_at,
        total_sent: c.total_sent,
        total_delivered: totalDelivered,
        delivery_rate: deliveryRate,
      };
    })
    .sort((a, b) => b.delivery_rate - a.delivery_rate)
    .slice(0, limit);

  return campaignsWithRates;
};

export const getBounceAnalysis = async (): Promise<BounceAnalysis[]> => {
  const { data: events } = await supabase
    .from("campaign_events")
    .select("bounce_reason")
    .eq("event_type", "bounced")
    .not("bounce_reason", "is", null);

  const reasonCounts: Record<string, number> = {};

  events?.forEach(event => {
    const reason = event.bounce_reason || "Unknown";
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  return Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
};

export const compareCampaigns = async (campaignIds: string[]): Promise<CampaignComparison[]> => {
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .in("id", campaignIds);

  if (!campaigns) return [];

  return campaigns.map(c => {
    const totalSent = c.total_sent || 0;
    const totalBounced = c.total_bounced || 0;
    const totalUnsubscribed = c.total_unsubscribed || 0;
    const totalDelivered = totalSent - totalBounced;
    
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const unsubscribeRate = totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0;
    
    // Success score: weighted average (delivery 60%, low bounce 30%, low unsubscribe 10%)
    const successScore = 
      (deliveryRate * 0.6) + 
      ((100 - bounceRate) * 0.3) + 
      ((100 - unsubscribeRate) * 0.1);

    return {
      id: c.id,
      subject: c.subject,
      sent_at: c.sent_at || "",
      total_recipients: c.total_recipients || 0,
      total_sent: totalSent,
      total_delivered: totalDelivered,
      total_bounced: totalBounced,
      total_unsubscribed: totalUnsubscribed,
      delivery_rate: deliveryRate,
      bounce_rate: bounceRate,
      unsubscribe_rate: unsubscribeRate,
      success_score: successScore,
    };
  });
};

export const getCampaignProgress = async (campaignId: string) => {
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  const { data: events } = await supabase
    .from("campaign_events")
    .select("event_type", { count: "exact" })
    .eq("campaign_id", campaignId);

  const sentCount = events?.filter(e => e.event_type === "sent").length || 0;
  const deliveredCount = events?.filter(e => e.event_type === "delivered").length || 0;
  const bouncedCount = events?.filter(e => e.event_type === "bounced").length || 0;
  const pendingCount = sentCount - deliveredCount - bouncedCount;

  return {
    campaign,
    sent: sentCount,
    delivered: deliveredCount,
    bounced: bouncedCount,
    pending: pendingCount,
    total: campaign?.total_recipients || 0,
    percentComplete: campaign?.total_recipients 
      ? (sentCount / campaign.total_recipients) * 100 
      : 0,
  };
};
