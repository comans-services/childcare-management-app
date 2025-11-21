import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ContactGrowthChartProps {
  data: {
    month: string;
    newContacts: number;
    totalContacts: number;
  }[];
}

export const ContactGrowthChart = ({ data }: ContactGrowthChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
        <Line 
          type="monotone" 
          dataKey="totalContacts" 
          stroke="hsl(var(--primary))" 
          strokeWidth={4}
          dot={{ r: 6 }}
          name="Total Contacts"
        />
        <Line 
          type="monotone" 
          dataKey="newContacts" 
          stroke="hsl(217, 91%, 60%)" 
          strokeWidth={3}
          dot={{ r: 5 }}
          name="New Contacts"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
