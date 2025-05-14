import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart3,
  Users,
  Building,
  FileText,
  Activity,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';

// Placeholder data for metrics
const systemMetrics = {
  totalUsers: 342,
  activeUsers: 218,
  newSignups: {
    count: 24,
    trend: '+12%'
  },
  appraisalsCompleted: {
    count: 156,
    trend: '+8%'
  },
  systemUptime: '99.98%',
  averageResponseTime: '0.82s',
  apiRequests: {
    count: '2.4M',
    trend: '+15%'
  }
};

// Placeholder data for user registration analytics
const userRegistrations = {
  daily: [18, 22, 19, 24, 15, 28, 21],
  weekly: [124, 145, 132, 156, 142, 168, 185],
  monthly: [560, 620, 680, 720, 690, 740, 790]
};

// Placeholder data for system alerts
const systemAlerts = [
  {
    id: 1,
    severity: 'high',
    message: 'Database backup failed on primary server',
    time: '2 hours ago',
    resolved: false
  },
  {
    id: 2,
    severity: 'medium',
    message: 'High memory usage detected on API server',
    time: '4 hours ago',
    resolved: false
  },
  {
    id: 3,
    severity: 'low',
    message: 'SSL certificate will expire in 30 days',
    time: '1 day ago',
    resolved: false
  },
  {
    id: 4,
    severity: 'low',
    message: 'Storage capacity reached 75% threshold',
    time: '2 days ago',
    resolved: true
  }
];

// Placeholder data for recent user activity
const recentActivity = [
  {
    id: 1,
    user: 'Sarah Johnson',
    action: 'Created a new appraisal',
    time: '15 minutes ago',
    icon: FileText
  },
  {
    id: 2,
    user: 'Michael Chen',
    action: 'Updated agent profile settings',
    time: '45 minutes ago',
    icon: Users
  },
  {
    id: 3,
    user: 'Jessica Williams',
    action: 'Generated property valuation report',
    time: '1 hour ago',
    icon: Building
  },
  {
    id: 4,
    user: 'David Rodriguez',
    action: 'Invited 3 new team members',
    time: '3 hours ago',
    icon: Users
  },
  {
    id: 5,
    user: 'Amanda Lee',
    action: 'Completed 5 property appraisals',
    time: '5 hours ago',
    icon: FileText
  }
];

const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor system performance and user activity.
        </p>
      </div>
      
      {/* System Metrics Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics.activeUsers} currently active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Signups
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.newSignups.count}</div>
            <p className="text-xs text-green-500 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {systemMetrics.newSignups.trend} from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Appraisals Completed
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.appraisalsCompleted.count}</div>
            <p className="text-xs text-green-500 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {systemMetrics.appraisalsCompleted.trend} from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              System Performance
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.systemUptime}</div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics.averageResponseTime} avg response time
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* User Registration Analytics Component */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>User Registration Analytics</CardTitle>
            <CardDescription>
              Track new user sign-ups over time
            </CardDescription>
            <div className="flex space-x-2">
              <Button 
                variant={timeRange === 'daily' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('daily')}
              >
                Daily
              </Button>
              <Button 
                variant={timeRange === 'weekly' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('weekly')}
              >
                Weekly
              </Button>
              <Button 
                variant={timeRange === 'monthly' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setTimeRange('monthly')}
              >
                Monthly
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] w-full">
              {/* Placeholder for chart - In a real implementation, this would be a proper chart component */}
              <div className="flex h-full items-end gap-2 pb-4">
                {userRegistrations[timeRange].map((value, i) => (
                  <div 
                    key={i} 
                    className="bg-primary/90 rounded-md w-full"
                    style={{ 
                      height: `${(value / Math.max(...userRegistrations[timeRange])) * 100}%`,
                      opacity: 0.8 + ((i / userRegistrations[timeRange].length) * 0.2)
                    }}
                  >
                    <div className="text-xs text-center text-white font-medium mt-1">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                {timeRange === 'daily' && (
                  <>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                    <div>Sun</div>
                  </>
                )}
                {timeRange === 'weekly' && (
                  <>
                    <div>Week 1</div>
                    <div>Week 2</div>
                    <div>Week 3</div>
                    <div>Week 4</div>
                    <div>Week 5</div>
                    <div>Week 6</div>
                    <div>Week 7</div>
                  </>
                )}
                {timeRange === 'monthly' && (
                  <>
                    <div>Jan</div>
                    <div>Feb</div>
                    <div>Mar</div>
                    <div>Apr</div>
                    <div>May</div>
                    <div>Jun</div>
                    <div>Jul</div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Alerts Section */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>
              Recent system notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemAlerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-md flex items-start gap-3 ${
                    alert.resolved 
                      ? 'bg-muted/50' 
                      : alert.severity === 'high' 
                        ? 'bg-red-100 dark:bg-red-900/20' 
                        : alert.severity === 'medium' 
                          ? 'bg-amber-100 dark:bg-amber-900/20' 
                          : 'bg-blue-100 dark:bg-blue-900/20'
                  }`}
                >
                  <AlertCircle className={`h-5 w-5 mt-0.5 ${
                    alert.resolved 
                      ? 'text-muted-foreground' 
                      : alert.severity === 'high' 
                        ? 'text-red-600 dark:text-red-400' 
                        : alert.severity === 'medium' 
                          ? 'text-amber-600 dark:text-amber-400' 
                          : 'text-blue-600 dark:text-blue-400'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      alert.resolved ? 'text-muted-foreground' : ''
                    }`}>
                      {alert.message}
                    </p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                      {alert.resolved ? (
                        <span className="text-xs">Resolved</span>
                      ) : (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full">
                View All Alerts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent User Activity</CardTitle>
          <CardDescription>
            Latest actions performed by users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map(item => (
              <div key={item.id} className="flex items-start gap-4 py-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.user}</p>
                  <p className="text-sm text-muted-foreground">{item.action}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.time}
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full mt-2">
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard; 