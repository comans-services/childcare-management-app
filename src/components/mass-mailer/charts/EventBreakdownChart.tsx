import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface EventBreakdownChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

export const EventBreakdownChart = ({ data }: EventBreakdownChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderLabel = (entry: any) => {
    const percent = ((entry.value / total) * 100).toFixed(0);
    return `${percent}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
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
      </PieChart>
    </ResponsiveContainer>
  );
};
