import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AgentDashboardKPI from '@/components/dashboard/AgentDashboardKPI';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import UpcomingTasks from '@/components/dashboard/UpcomingTasks';
import RecentAppraisals from '@/components/dashboard/RecentAppraisals';
import PropertyOverviewCards from '@/components/customer/PropertyOverviewCards';
import CustomerRecentAppraisals from '@/components/customer/RecentAppraisals';
import NotificationCenter from '@/components/customer/NotificationCenter';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  
  // Mock data for customer dashboard
  const [mockProperties] = useState([
    {
      id: 'prop1',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      type: 'Residential',
      status: 'Active',
      lastAppraisal: {
        date: new Date('2023-11-15'),
        value: 850000
      },
      dateAdded: new Date('2023-01-10')
    },
    {
      id: 'prop2',
      address: '456 Park Avenue',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94108',
      type: 'Commercial',
      status: 'Pending',
      lastAppraisal: {
        date: new Date('2023-10-20'),
        value: 1250000
      },
      dateAdded: new Date('2023-03-22')
    }
  ]);
  
  const [mockAppraisals] = useState([
    {
      id: 'apr1',
      propertyId: 'prop1',
      propertyAddress: '123 Main Street, San Francisco',
      status: 'Completed',
      date: new Date('2023-11-15'),
      value: 850000,
      previousValue: 820000,
      changePercentage: 3.66,
      agent: {
        name: 'John Smith',
        avatar: ''
      }
    },
    {
      id: 'apr2',
      propertyId: 'prop2',
      propertyAddress: '456 Park Avenue, San Francisco',
      status: 'In Progress',
      date: new Date('2023-10-20'),
      value: 1250000,
      previousValue: 1180000,
      changePercentage: 5.93,
      agent: {
        name: 'Sarah Johnson',
        avatar: ''
      }
    }
  ]);
  
  const [notifications, setNotifications] = useState([
    {
      id: 'notif1',
      type: 'info' as const,
      title: 'New appraisal scheduled',
      message: 'An appraisal for 123 Main Street has been scheduled for next Tuesday.',
      date: new Date('2023-12-01'),
      isRead: false,
      actionLink: '/dashboard/appraisals/apr1',
      actionText: 'View details'
    },
    {
      id: 'notif2',
      type: 'success' as const,
      title: 'Appraisal completed',
      message: 'The appraisal for 456 Park Avenue has been completed.',
      date: new Date('2023-11-28'),
      isRead: true,
      actionLink: '/dashboard/appraisals/apr2',
      actionText: 'View report'
    },
    {
      id: 'notif3',
      type: 'action_required' as const,
      title: 'Action required',
      message: 'Please provide additional information for your property at 123 Main Street.',
      date: new Date('2023-11-25'),
      isRead: false,
      actionLink: '/dashboard/properties/prop1',
      actionText: 'Complete now'
    }
  ]);
  
  // Handler for marking notification as read
  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, isRead: true } : notif
    ));
  };
  
  // Handler for marking all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
  };

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
    <>
      {/* Property Overview Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">My Properties</h2>
        <PropertyOverviewCards properties={mockProperties} />
      </div>
      
      {/* Recent Appraisals and Notifications */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <CustomerRecentAppraisals appraisals={mockAppraisals} />
        </div>
        <div>
          <NotificationCenter 
            notifications={notifications} 
            onMarkAsRead={handleMarkAsRead} 
            onMarkAllAsRead={handleMarkAllAsRead} 
          />
        </div>
      </div>
    </>
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