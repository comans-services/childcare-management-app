
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", 
  "#8884D8", "#82CA9D", "#FFBDD3", "#FF6B6B", 
  "#6A7FDB", "#9ACEEB"
];

interface ChartSectionProps {
  projectsChartData: Array<{ name: string; hours: number }>;
  customersChartData: Array<{ name: string; hours: number }>;
  isLoading: boolean;
  hasError: boolean;
}

const ChartSection: React.FC<ChartSectionProps> = ({
  projectsChartData,
  customersChartData,
  isLoading,
  hasError,
}) => {
  const renderContent = (data: Array<{ name: string; hours: number }>, type: "bar" | "pie") => {
    if (isLoading) {
      return (
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-400">Loading {type === "bar" ? "project" : "customer"} data...</p>
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="h-80 flex items-center justify-center text-red-500">
          <p>Error loading {type === "bar" ? "project" : "customer"} data. Please refresh the page.</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-gray-400">
          <p>No {type === "bar" ? "timesheet" : "customer"} data available</p>
        </div>
      );
    }

    if (type === "bar") {
      return (
        <ChartContainer className="aspect-video h-80" config={{}}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="hours" fill="#8884d8" />
          </BarChart>
        </ChartContainer>
      );
    }

    return (
      <ChartContainer className="aspect-video h-80" config={{}}>
        <PieChart>
          <Pie 
            data={data} 
            dataKey="hours" 
            nameKey="name" 
            cx="50%" 
            cy="50%" 
            outerRadius={80}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
        </PieChart>
      </ChartContainer>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Hours by Project</CardTitle>
          <CardDescription>Distribution of your hours across projects</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent(projectsChartData, "bar")}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Hours by Customer</CardTitle>
          <CardDescription>Distribution of your hours across customers</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent(customersChartData, "pie")}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartSection;
