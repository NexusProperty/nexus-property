import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Search, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { fetchAgentDashboardMetrics } from "@/services/appraisalService";

const AgentDashboard: React.FC = () => {
  // Fetch dashboard metrics
  const { data: metrics, isLoading, isError } = useQuery([
    "agent-dashboard-metrics"
  ], fetchAgentDashboardMetrics);

  // Example fallback data for chart
  const chartData = metrics?.monthlyCompleted || [
    { month: "Jan", completed: 0 },
    { month: "Feb", completed: 0 },
    { month: "Mar", completed: 0 },
    { month: "Apr", completed: 0 },
    { month: "May", completed: 0 },
    { month: "Jun", completed: 0 },
    { month: "Jul", completed: 0 },
    { month: "Aug", completed: 0 },
    { month: "Sep", completed: 0 },
    { month: "Oct", completed: 0 },
    { month: "Nov", completed: 0 },
    { month: "Dec", completed: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your AppraisalHub agent portal.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Appraisals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : metrics?.totalAppraisals ?? "-"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : metrics?.newLeads ?? "-"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : metrics?.completedThisMonth ?? "-"}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Appraisals Completed Per Month</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 300 }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="completed" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Appraisals</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/agent/appraisals">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">123 Main Street, Auckland</p>
                  <p className="text-sm text-muted-foreground">Claimed on May 1, 2025</p>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/agent/appraisals/1">
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">456 Queen Street, Wellington</p>
                  <p className="text-sm text-muted-foreground">Claimed on April 28, 2025</p>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/agent/appraisals/2">
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Leads</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/agent/appraisal-feed">View Feed</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">789 High Street, Christchurch</p>
                  <p className="text-sm text-muted-foreground">Published on May 2, 2025</p>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/agent/appraisal-feed">
                    <Search className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">101 Beach Road, Tauranga</p>
                  <p className="text-sm text-muted-foreground">Published on May 1, 2025</p>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/agent/appraisal-feed">
                    <Search className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-center">
        <Button size="lg" asChild>
          <Link to="/agent/appraisal-feed">
            <Plus className="mr-2 h-4 w-4" />
            Find New Leads
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default AgentDashboard;
