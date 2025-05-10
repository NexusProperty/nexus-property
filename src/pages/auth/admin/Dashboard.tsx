import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminDashboardMetrics, AdminDashboardMetrics } from "@/services/adminService";
import { formatDistanceToNow } from "date-fns";
import IntegrationList from '@/components/integrations/IntegrationList';

const AdminDashboard: React.FC = () => {
  // Fetch dashboard metrics
  const { data: metrics, isLoading, isError } = useQuery<AdminDashboardMetrics>({
    queryKey: ["admin-dashboard-metrics"],
    queryFn: fetchAdminDashboardMetrics
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and key metrics.
        </p>
      </div>
      
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : metrics?.totalUsers ?? "-"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : metrics?.totalAgents ?? "-"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : metrics?.totalCustomers ?? "-"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Appraisals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : metrics?.monthlyAppraisals ?? "-"}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>API Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  metrics?.systemHealth?.apiStatus === "Operational" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {isLoading ? "..." : metrics?.systemHealth?.apiStatus ?? "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Database</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  metrics?.systemHealth?.database === "Healthy" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {isLoading ? "..." : metrics?.systemHealth?.database ?? "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>External APIs</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  metrics?.systemHealth?.externalApis === "Connected" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {isLoading ? "..." : metrics?.systemHealth?.externalApis ?? "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Scheduled Tasks</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  metrics?.systemHealth?.scheduledTasks === "Running" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {isLoading ? "..." : metrics?.systemHealth?.scheduledTasks ?? "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div>Loading activity...</div>
              ) : isError ? (
                <div>Error loading activity</div>
              ) : metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
                metrics.recentActivity.map((activity, index) => (
                  <div 
                    key={index} 
                    className={`border-l-4 pl-3 py-1 ${
                      activity.type === "user" ? "border-blue-500" :
                      activity.type === "system" ? "border-green-500" :
                      activity.type === "warning" ? "border-amber-500" :
                      "border-gray-500"
                    }`}
                  >
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                ))
              ) : (
                <div>No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Integration Management</h2>
        <IntegrationList />
      </div>
    </div>
  );
};

export default AdminDashboard;
