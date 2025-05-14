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
  Users,
  UserPlus,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Edit,
  Settings,
  BarChart,
  FileText,
  MoreHorizontal,
  UserMinus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Placeholder team data
const mockTeams = [
  {
    id: 1,
    name: 'Management',
    lead: 'Sarah Johnson',
    leadId: 1,
    members: 4,
    properties: 0,
    appraisals: 0,
    averageRating: 0,
    appraisalTime: '0 days',
    region: 'All',
    specialty: 'Administration',
    performanceTrend: 'stable',
    description: 'System administration team responsible for platform management and oversight.'
  },
  {
    id: 2,
    name: 'West Region',
    lead: 'Michael Chen',
    leadId: 2,
    members: 12,
    properties: 98,
    appraisals: 76,
    averageRating: 4.8,
    appraisalTime: '3.2 days',
    region: 'West',
    specialty: 'Mixed',
    performanceTrend: 'up',
    description: 'Regional team handling property appraisals across the western United States, specializing in both residential and commercial properties.'
  }
];

// Placeholder team members data
const mockTeamMembers = [
  {
    id: 1,
    teamId: 1,
    name: 'Sarah Johnson',
    role: 'Team Lead',
    email: 'sarah.johnson@example.com',
    position: 'Senior Administrator',
    joined: '2022-01-15',
    appraisals: 0,
    performance: 'N/A'
  },
  {
    id: 2,
    teamId: 1,
    name: 'Robert Williams',
    role: 'Member',
    email: 'robert.williams@example.com',
    position: 'System Administrator',
    joined: '2022-02-10',
    appraisals: 0,
    performance: 'N/A'
  },
  {
    id: 3,
    teamId: 1,
    name: 'Jennifer Adams',
    role: 'Member',
    email: 'jennifer.adams@example.com',
    position: 'User Manager',
    joined: '2022-03-05',
    appraisals: 0,
    performance: 'N/A'
  },
  {
    id: 4,
    teamId: 1,
    name: 'David Miller',
    role: 'Member',
    email: 'david.miller@example.com',
    position: 'Support Specialist',
    joined: '2022-04-20',
    appraisals: 0,
    performance: 'N/A'
  },
  {
    id: 5,
    teamId: 2,
    name: 'Michael Chen',
    role: 'Team Lead',
    email: 'michael.chen@example.com',
    position: 'Senior Appraiser',
    joined: '2022-01-05',
    appraisals: 32,
    performance: 'Excellent'
  },
  {
    id: 6,
    teamId: 2,
    name: 'Emily Johnson',
    role: 'Member',
    email: 'emily.johnson@example.com',
    position: 'Residential Appraiser',
    joined: '2022-02-15',
    appraisals: 28,
    performance: 'Good'
  }
];

// Placeholder recent appraisals data
const mockRecentAppraisals = [
  {
    id: 1,
    teamId: 2,
    property: '123 Main St, San Francisco, CA',
    type: 'Residential',
    date: '2023-06-15',
    value: '$1,250,000',
    appraiser: 'Michael Chen'
  },
  {
    id: 2,
    teamId: 2,
    property: '456 Market St, San Francisco, CA',
    type: 'Commercial',
    date: '2023-06-10',
    value: '$3,750,000',
    appraiser: 'Emily Johnson'
  },
  {
    id: 3,
    teamId: 2,
    property: '789 Oak Ave, Oakland, CA',
    type: 'Residential',
    date: '2023-06-05',
    value: '$950,000',
    appraiser: 'Michael Chen'
  }
];

const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Find team by ID
  const team = mockTeams.find(t => t.id === Number(teamId));
  
  // If team not found, redirect to teams list
  if (!team) {
    navigate('/admin/teams');
    return null;
  }
  
  // Get team members
  const teamMembers = mockTeamMembers.filter(m => m.teamId === team.id);
  
  // Get team's recent appraisals
  const recentAppraisals = mockRecentAppraisals.filter(a => a.teamId === team.id);
  
  const handleBackClick = () => {
    navigate('/admin/teams');
  };
  
  // Function to render performance trend icon
  const renderPerformanceTrend = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <ArrowRightLeft className="h-5 w-5 text-amber-500" />;
    }
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
          <h1 className="text-2xl font-bold tracking-tight">Team Details</h1>
          <p className="text-muted-foreground">
            View and manage team information and members.
          </p>
        </div>
      </div>
      
      {/* Team Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex gap-4 items-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-8 w-8 text-primary" />
              </div>
              
              <div>
                <h2 className="text-xl font-bold">{team.name}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>Lead: {team.lead}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary">{team.specialty}</Badge>
                  {team.region !== 'All' && (
                    <Badge variant="outline">{team.region} Region</Badge>
                  )}
                  <Badge variant={
                    team.performanceTrend === 'up' 
                      ? 'default' 
                      : team.performanceTrend === 'down' 
                        ? 'destructive' 
                        : 'outline'
                  }>
                    <div className="flex items-center gap-1">
                      {renderPerformanceTrend(team.performanceTrend)}
                      <span>{team.performanceTrend === 'up' ? 'Improving' : team.performanceTrend === 'down' ? 'Declining' : 'Stable'}</span>
                    </div>
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 justify-end items-start sm:items-center">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Team
              </Button>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Team Detail Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Users className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          {team.appraisals > 0 && (
            <TabsTrigger value="appraisals">
              <FileText className="h-4 w-4 mr-2" />
              Appraisals
            </TabsTrigger>
          )}
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
              <CardDescription>
                Basic information about the team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-base font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{team.description}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{team.members}</p>
                      <p className="text-sm text-muted-foreground">Team Members</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{team.properties}</p>
                      <p className="text-sm text-muted-foreground">Properties</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{team.appraisals}</p>
                      <p className="text-sm text-muted-foreground">Appraisals</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {team.appraisals > 0 && (
                <>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Average Rating</p>
                            <p className="text-2xl font-bold">{team.averageRating.toFixed(1)}</p>
                          </div>
                          <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full">
                            <BarChart className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Avg. Appraisal Time</p>
                            <p className="text-2xl font-bold">{team.appraisalTime}</p>
                          </div>
                          <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full">
                            <ArrowRightLeft className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Team Members Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Members currently assigned to this team.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setActiveTab('members')}>
                View All Members
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.slice(0, 3).map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 border rounded-md">
                    <Avatar>
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.position}</p>
                      <div className="mt-1">
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage team members and their roles.
                  </CardDescription>
                </div>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Appraisals</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map(member => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} />
                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.position}</TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'Team Lead' ? 'default' : 'outline'}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(member.joined).toLocaleDateString()}</TableCell>
                      <TableCell>{member.appraisals}</TableCell>
                      <TableCell>{member.performance}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              Edit Member
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500">
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Team performance statistics and trends.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {team.appraisals > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full">
                          <BarChart className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Rating</p>
                          <p className="text-2xl font-bold">{team.averageRating.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full">
                          <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Time</p>
                          <p className="text-2xl font-bold">{team.appraisalTime}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          team.performanceTrend === 'up'
                            ? 'bg-green-100 dark:bg-green-900/20'
                            : team.performanceTrend === 'down'
                              ? 'bg-red-100 dark:bg-red-900/20'
                              : 'bg-amber-100 dark:bg-amber-900/20'
                        }`}>
                          {renderPerformanceTrend(team.performanceTrend)}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Trend</p>
                          <p className="text-xl font-bold">{
                            team.performanceTrend === 'up'
                              ? 'Improving'
                              : team.performanceTrend === 'down'
                                ? 'Declining'
                                : 'Stable'
                          }</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    Detailed performance graphs would be displayed here in a real implementation.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <BarChart className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No performance data available for this team.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Performance metrics will be available once the team completes appraisals.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appraisals Tab */}
        {team.appraisals > 0 && (
          <TabsContent value="appraisals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Appraisals</CardTitle>
                <CardDescription>
                  Recent property appraisals conducted by this team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Appraiser</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAppraisals.map(appraisal => (
                      <TableRow key={appraisal.id}>
                        <TableCell className="font-medium">{appraisal.property}</TableCell>
                        <TableCell>{appraisal.type}</TableCell>
                        <TableCell>{new Date(appraisal.date).toLocaleDateString()}</TableCell>
                        <TableCell>{appraisal.value}</TableCell>
                        <TableCell>{appraisal.appraiser}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>
                Manage team settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Team settings controls would be displayed here in a real implementation.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamDetail; 