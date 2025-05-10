
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";

export function Dashboard() {
  const [duration, setDuration] = useState<"weekly" | "monthly">("monthly");

  // Using the correct QueryClient syntax
  const { data, isLoading } = useQuery({
    queryKey: ['agent-dashboard-metrics'],
    queryFn: async () => {
      return {
        monthlyCompleted: 12,
        totalAppraisals: 24,
        newLeads: 8,
        completedThisMonth: 12
      };
    }
  });

  // Demo chart data
  const chartData = [
    { name: "Jan", value: 4 },
    { name: "Feb", value: 7 },
    { name: "Mar", value: 3 },
    { name: "Apr", value: 5 },
    { name: "May", value: 9 },
    { name: "Jun", value: data?.monthlyCompleted || 0 },
  ];

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Agent Dashboard</h1>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Appraisals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.totalAppraisals || 0}</div>
                <p className="text-xs text-muted-foreground">All time appraisals</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.newLeads || 0}</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.completedThisMonth || 0}</div>
                <p className="text-xs text-muted-foreground">+12 since last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Completed Appraisals</CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Dashboard;
