import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Building, TrendingUp, RefreshCw } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();

  // Stats cards data - this would come from API in a real app
  const getAgentStats = () => [
    {
      title: 'Total Appraisals',
      value: '24',
      description: '3 pending completion',
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      change: '+4 this month',
      changeType: 'increase',
    },
    {
      title: 'Active Clients',
      value: '18',
      description: '2 new this month',
      icon: <Users className="h-5 w-5 text-green-500" />,
      change: '+2 this month',
      changeType: 'increase',
    },
    {
      title: 'Properties',
      value: '32',
      description: 'Across all clients',
      icon: <Building className="h-5 w-5 text-purple-500" />,
      change: '+5 this month',
      changeType: 'increase',
    },
    {
      title: 'Average Value',
      value: '$842,500',
      description: 'Across all appraisals',
      icon: <TrendingUp className="h-5 w-5 text-yellow-500" />,
      change: '+2.4% from last month',
      changeType: 'increase',
    },
  ];

  const getCustomerStats = () => [
    {
      title: 'My Properties',
      value: '2',
      description: 'Currently registered',
      icon: <Building className="h-5 w-5 text-blue-500" />,
      change: 'No change',
      changeType: 'neutral',
    },
    {
      title: 'Recent Appraisals',
      value: '1',
      description: 'In the last 6 months',
      icon: <FileText className="h-5 w-5 text-green-500" />,
      change: '+1 this month',
      changeType: 'increase',
    },
    {
      title: 'Market Trend',
      value: '+3.2%',
      description: 'In your area',
      icon: <TrendingUp className="h-5 w-5 text-yellow-500" />,
      change: 'Updated today',
      changeType: 'neutral',
    },
    {
      title: 'New Listings',
      value: '8',
      description: 'Similar properties nearby',
      icon: <RefreshCw className="h-5 w-5 text-purple-500" />,
      change: '+2 this week',
      changeType: 'increase',
    },
  ];

  const getAdminStats = () => [
    {
      title: 'Total Users',
      value: '156',
      description: '12 new this month',
      icon: <Users className="h-5 w-5 text-blue-500" />,
      change: '+12 this month',
      changeType: 'increase',
    },
    {
      title: 'Total Appraisals',
      value: '284',
      description: '24 this month',
      icon: <FileText className="h-5 w-5 text-green-500" />,
      change: '+24 this month',
      changeType: 'increase',
    },
    {
      title: 'Properties',
      value: '427',
      description: 'In the system',
      icon: <Building className="h-5 w-5 text-purple-500" />,
      change: '+32 this month',
      changeType: 'increase',
    },
    {
      title: 'System Status',
      value: 'Healthy',
      description: 'All systems operational',
      icon: <RefreshCw className="h-5 w-5 text-yellow-500" />,
      change: 'No issues detected',
      changeType: 'neutral',
    },
  ];

  // Get appropriate stats based on user role
  const getStats = () => {
    if (!profile) return [];
    
    switch (profile.role) {
      case 'agent':
        return getAgentStats();
      case 'customer':
        return getCustomerStats();
      case 'admin':
        return getAdminStats();
      default:
        return [];
    }
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name || 'User'}! Here's an overview of your activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <p className={`text-xs mt-1 ${
                stat.changeType === 'increase' ? 'text-green-500' : 
                stat.changeType === 'decrease' ? 'text-red-500' : 'text-gray-500'
              }`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role-specific content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* We would add role-specific widgets here in a real app */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks based on your recent activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Quick actions will appear here based on your usage patterns.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest actions in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your recent activity will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;