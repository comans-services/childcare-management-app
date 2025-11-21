import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CampaignPerformanceChartProps {
  data: {
    month: string;
    campaigns: number;
  }[];
}

export const CampaignPerformanceChart = ({ data }: CampaignPerformanceChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="month" 
          style={{ fontSize: "14px" }}
          stroke="hsl(var(--foreground))"
        />
        <YAxis 
          style={{ fontSize: "14px" }}
          stroke="hsl(var(--foreground))"
        />
        <Tooltip 
          contentStyle={{ 
            fontSize: "16px",
            backgroundColor: "hsl(var(--background))",
            border: "2px solid hsl(var(--border))"
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: "16px" }}
          iconSize={20}
        />
        <Bar 
          dataKey="campaigns" 
          fill="hsl(var(--primary))" 
          radius={[8, 8, 0, 0]}
          name="Campaigns Sent"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
