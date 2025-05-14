import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  FileText,
  Settings,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Edit,
  Trash2
} from 'lucide-react';

// Placeholder user data
const mockUsers = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 123-4567',
    role: 'Admin',
    status: 'Active',
    lastActive: '5 minutes ago',
    createdAt: '2023-05-10',
    joinDate: 'May 10, 2023',
    properties: 0,
    appraisals: 0,
    teams: ['Management'],
    bio: 'System administrator with full access to all platform features and settings.',
    permissions: ['Manage Users', 'Manage Teams', 'System Settings', 'View Reports', 'Manage Properties', 'Manage Appraisals']
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    phone: '+1 (555) 987-6543',
    role: 'Agent',
    status: 'Active',
    lastActive: '2 hours ago',
    createdAt: '2023-04-22',
    joinDate: 'April 22, 2023',
    properties: 12,
    appraisals: 8,
    teams: ['West Region', 'Commercial'],
    bio: 'Senior property appraiser specializing in commercial real estate valuation.',
    permissions: ['View Reports', 'Manage Properties', 'Manage Appraisals', 'View Clients']
  }
];

// Placeholder activity data
const mockActivityHistory = [
  {
    id: 1,
    action: 'Reset password',
    timestamp: 'Today at 10:23 AM',
    ip: '192.168.1.45',
    device: 'Chrome on Windows',
    status: 'Success'
  },
  {
    id: 2,
    action: 'Login',
    timestamp: 'Today at 09:15 AM',
    ip: '192.168.1.45',
    device: 'Chrome on Windows',
    status: 'Success'
  },
  {
    id: 3,
    action: 'Updated profile',
    timestamp: 'Yesterday at 03:45 PM',
    ip: '192.168.1.45',
    device: 'Chrome on Windows',
    status: 'Success'
  },
  {
    id: 4,
    action: 'Login',
    timestamp: 'Yesterday at 08:30 AM',
    ip: '192.168.1.45',
    device: 'Chrome on Windows',
    status: 'Success'
  },
  {
    id: 5,
    action: 'Failed login attempt',
    timestamp: '3 days ago at 07:22 PM',
    ip: '192.168.1.90',
    device: 'Safari on macOS',
    status: 'Failed'
  },
  {
    id: 6,
    action: 'Created appraisal #APR-2023-089',
    timestamp: '5 days ago at 11:15 AM',
    ip: '192.168.1.45',
    device: 'Chrome on Windows',
    status: 'Success'
  }
];

// Placeholder properties data
const mockProperties = [
  {
    id: 1,
    address: '123 Main St, San Francisco, CA 94105',
    type: 'Commercial',
    status: 'Active',
    lastAppraisal: 'June 15, 2023'
  },
  {
    id: 2,
    address: '456 Market St, San Francisco, CA 94103',
    type: 'Residential',
    status: 'Pending',
    lastAppraisal: 'May 28, 2023'
  }
];

// Placeholder appraisals data
const mockAppraisals = [
  {
    id: 1,
    propertyAddress: '123 Main St, San Francisco, CA 94105',
    date: 'June 15, 2023',
    status: 'Completed',
    value: '$2,450,000'
  },
  {
    id: 2,
    propertyAddress: '456 Market St, San Francisco, CA 94103',
    date: 'May 28, 2023',
    status: 'In Progress',
    value: 'Pending'
  }
];

const UserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Find user by ID
  const user = mockUsers.find(u => u.id === Number(userId));
  
  // If user not found, redirect to users list
  if (!user) {
    navigate('/admin/users');
    return null;
  }
  
  const handleBackClick = () => {
    navigate('/admin/users');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground">
            View and manage user information and permissions.
          </p>
        </div>
      </div>
      
      {/* User Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex gap-4 items-center">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} />
                <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant={user.role === 'Admin' ? 'default' : user.role === 'Agent' ? 'secondary' : 'outline'}>
                    {user.role}
                  </Badge>
                  <Badge variant={user.status === 'Active' ? 'default' : user.status === 'Pending' ? 'secondary' : 'destructive'}>
                    {user.status}
                  </Badge>
                  {user.teams.map(team => (
                    <Badge key={team} variant="outline">{team}</Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 justify-end items-start sm:items-center">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* User Detail Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Clock className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="properties">
            <Building className="h-4 w-4 mr-2" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="appraisals">
            <FileText className="h-4 w-4 mr-2" />
            Appraisals
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Basic information about the user.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p>{user.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{user.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User Type</p>
                  <p>{user.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="flex items-center gap-1">
                    {user.status === 'Active' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : user.status === 'Pending' ? (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>{user.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Join Date</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{user.joinDate}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Activity</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{user.lastActive}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teams</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.teams.map(team => (
                      <Badge key={team} variant="outline">{team}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Bio</p>
                <p className="text-sm">{user.bio}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{user.properties}</p>
                      <p className="text-sm text-muted-foreground">Properties</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{user.appraisals}</p>
                      <p className="text-sm text-muted-foreground">Appraisals</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{user.teams.length}</p>
                      <p className="text-sm text-muted-foreground">Teams</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>
                Recent user actions and system events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockActivityHistory.map(activity => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.action}</TableCell>
                      <TableCell>{activity.timestamp}</TableCell>
                      <TableCell>{activity.ip}</TableCell>
                      <TableCell>{activity.device}</TableCell>
                      <TableCell>
                        <Badge variant={activity.status === 'Success' ? 'default' : 'destructive'}>
                          {activity.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Load More
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Properties</CardTitle>
              <CardDescription>
                Properties associated with this user.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.properties > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Appraisal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProperties.map(property => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">{property.address}</TableCell>
                        <TableCell>{property.type}</TableCell>
                        <TableCell>
                          <Badge variant={
                            property.status === 'Active' ? 'default' : 
                            property.status === 'Pending' ? 'secondary' : 'outline'
                          }>
                            {property.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{property.lastAppraisal}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Building className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No properties associated with this user.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appraisals Tab */}
        <TabsContent value="appraisals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appraisals</CardTitle>
              <CardDescription>
                Appraisals conducted by this user.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.appraisals > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAppraisals.map(appraisal => (
                      <TableRow key={appraisal.id}>
                        <TableCell className="font-medium">{appraisal.propertyAddress}</TableCell>
                        <TableCell>{appraisal.date}</TableCell>
                        <TableCell>
                          <Badge variant={
                            appraisal.status === 'Completed' ? 'default' : 
                            appraisal.status === 'In Progress' ? 'secondary' : 'outline'
                          }>
                            {appraisal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{appraisal.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No appraisals conducted by this user.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Permissions</CardTitle>
              <CardDescription>
                Manage what this user can access and modify.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.permissions.map((permission, index) => (
                  <div key={index} className="flex items-center p-3 border rounded-md">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                    <span>{permission}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Permissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDetail; 