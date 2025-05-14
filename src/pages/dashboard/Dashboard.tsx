import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AgentDashboardKPI from '@/components/dashboard/AgentDashboardKPI';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import UpcomingTasks from '@/components/dashboard/UpcomingTasks';
import RecentAppraisals from '@/components/dashboard/RecentAppraisals';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();

  // Render dashboard based on user role
  const renderDashboard = () => {
    if (!profile) return <div>Loading...</div>;
    
    switch (profile.role) {
      case 'agent':
        return renderAgentDashboard();
      case 'customer':
        return renderCustomerDashboard();
      case 'admin':
        return renderAdminDashboard();
      default:
        return <div>Unknown user role</div>;
    }
  };

  const renderAgentDashboard = () => (
    <>
      {/* KPI Metrics */}
      <AgentDashboardKPI />
      
      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2">
          <QuickActions />
        </div>
        
        <div className="md:col-span-2 lg:col-span-1 space-y-6">
          <UpcomingTasks />
        </div>
        
        <div className="space-y-6">
          <ActivityFeed />
        </div>
        
        <div className="md:col-span-2">
          <RecentAppraisals />
        </div>
      </div>
    </>
  );

  const renderCustomerDashboard = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="col-span-2">
        <p className="text-base text-muted-foreground mb-6">
          Customer dashboard will be implemented soon.
        </p>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="col-span-2">
        <p className="text-base text-muted-foreground mb-6">
          Admin dashboard will be implemented soon.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name || 'User'}! Here's an overview of your activity.
        </p>
      </div>

      {renderDashboard()}
    </div>
  );
};

export default Dashboard;