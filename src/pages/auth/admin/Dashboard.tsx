
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminDashboard: React.FC = () => {
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
            <div className="text-3xl font-bold">1,204</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">126</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,078</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Appraisals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">543</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>API Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Healthy</span>
              </div>
              <div className="flex justify-between items-center">
                <span>External APIs</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Scheduled Tasks</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Running</span>
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
              <div className="border-l-4 border-blue-500 pl-3 py-1">
                <p className="text-sm font-medium">New agent registered</p>
                <p className="text-xs text-muted-foreground">Today, 10:32 AM</p>
              </div>
              <div className="border-l-4 border-green-500 pl-3 py-1">
                <p className="text-sm font-medium">System backup completed</p>
                <p className="text-xs text-muted-foreground">Today, 03:15 AM</p>
              </div>
              <div className="border-l-4 border-amber-500 pl-3 py-1">
                <p className="text-sm font-medium">API rate limit reached</p>
                <p className="text-xs text-muted-foreground">Yesterday, 4:23 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
