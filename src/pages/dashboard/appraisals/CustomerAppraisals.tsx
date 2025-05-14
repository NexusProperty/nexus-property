import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  FileText, 
  Calendar, 
  MoreVertical, 
  Eye, 
  MessageSquare, 
  Download, 
  Filter, 
  ArrowUpDown,
  Clock,
  ChevronRight,
  Home
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

// Types
interface Appraisal {
  id: string;
  propertyId: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Requested' | 'Cancelled';
  date: Date;
  requestDate: Date;
  value?: number;
  previousValue?: number;
  changePercentage?: number;
  agent?: {
    id: string;
    name: string;
    avatar?: string;
  };
  hasReport: boolean;
}

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

const CustomerAppraisals: React.FC = () => {
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [propertyFilter, setPropertyFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Mock data for properties
  const [properties] = useState<Property[]>([
    {
      id: 'prop1',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
    },
    {
      id: 'prop2',
      address: '456 Park Avenue',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94108',
    },
    {
      id: 'prop3',
      address: '789 Sunset Boulevard',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90046',
    }
  ]);

  // Mock data for appraisals
  const [appraisals] = useState<Appraisal[]>([
    {
      id: 'apr1',
      propertyId: 'prop1',
      propertyAddress: '123 Main Street',
      propertyCity: 'San Francisco',
      propertyState: 'CA',
      status: 'Completed',
      date: new Date('2023-11-15'),
      requestDate: new Date('2023-11-01'),
      value: 850000,
      previousValue: 820000,
      changePercentage: 3.66,
      agent: {
        id: 'agent1',
        name: 'John Smith',
        avatar: '',
      },
      hasReport: true,
    },
    {
      id: 'apr2',
      propertyId: 'prop2',
      propertyAddress: '456 Park Avenue',
      propertyCity: 'San Francisco',
      propertyState: 'CA',
      status: 'In Progress',
      date: new Date('2023-12-10'), // Expected completion date
      requestDate: new Date('2023-11-25'),
      agent: {
        id: 'agent2',
        name: 'Sarah Johnson',
        avatar: '',
      },
      hasReport: false,
    },
    {
      id: 'apr3',
      propertyId: 'prop3',
      propertyAddress: '789 Sunset Boulevard',
      propertyCity: 'Los Angeles',
      propertyState: 'CA',
      status: 'Scheduled',
      date: new Date('2023-12-20'), // Scheduled date
      requestDate: new Date('2023-12-01'),
      agent: {
        id: 'agent3',
        name: 'Michael Brown',
        avatar: '',
      },
      hasReport: false,
    },
    {
      id: 'apr4',
      propertyId: 'prop1',
      propertyAddress: '123 Main Street',
      propertyCity: 'San Francisco',
      propertyState: 'CA',
      status: 'Requested',
      date: new Date('2024-01-05'), // Requested for this date
      requestDate: new Date('2023-12-05'),
      hasReport: false,
    },
    {
      id: 'apr5',
      propertyId: 'prop1',
      propertyAddress: '123 Main Street',
      propertyCity: 'San Francisco',
      propertyState: 'CA',
      status: 'Completed',
      date: new Date('2022-10-05'),
      requestDate: new Date('2022-09-20'),
      value: 820000,
      previousValue: 780000,
      changePercentage: 5.13,
      agent: {
        id: 'agent1',
        name: 'John Smith',
        avatar: '',
      },
      hasReport: true,
    }
  ]);

  // Get status badge color
  const getStatusBadgeClass = (status: Appraisal['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'Requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter appraisals based on search and filters
  const filteredAppraisals = appraisals.filter(appraisal => {
    // Search query filter
    const matchesSearch = searchQuery === '' || 
      appraisal.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appraisal.propertyCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appraisal.agent?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    // Status filter
    const matchesStatus = statusFilter === '' || appraisal.status === statusFilter;
    
    // Property filter
    const matchesProperty = propertyFilter === '' || appraisal.propertyId === propertyFilter;
    
    // Date filter
    let matchesDate = true;
    const now = new Date();
    
    if (dateFilter === 'past30') {
      // Past 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      matchesDate = appraisal.date >= thirtyDaysAgo;
    } else if (dateFilter === 'past90') {
      // Past 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(now.getDate() - 90);
      matchesDate = appraisal.date >= ninetyDaysAgo;
    } else if (dateFilter === 'upcoming') {
      // Upcoming (future dates)
      matchesDate = appraisal.date > now;
    }
    
    return matchesSearch && matchesStatus && matchesProperty && matchesDate;
  });

  // Get appropriate date label based on status
  const getDateLabel = (appraisal: Appraisal) => {
    switch (appraisal.status) {
      case 'Completed':
        return 'Completed on:';
      case 'In Progress':
        return 'Expected by:';
      case 'Scheduled':
        return 'Scheduled for:';
      case 'Requested':
        return 'Requested for:';
      default:
        return 'Date:';
    }
  };

  // Group appraisals by status for the dashboard view
  const appraisalsByStatus = {
    active: appraisals.filter(a => ['In Progress', 'Scheduled', 'Requested'].includes(a.status)),
    completed: appraisals.filter(a => a.status === 'Completed'),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Appraisals</h1>
          <p className="text-muted-foreground">
            Track and manage appraisals for your properties.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/properties">
            <Home className="mr-2 h-4 w-4" />
            My Properties
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Appraisals</TabsTrigger>
            <TabsTrigger value="active" className="relative">
              Active
              {appraisalsByStatus.active.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {appraisalsByStatus.active.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by address or agent..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Requested">Requested</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Any Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Time</SelectItem>
                <SelectItem value="past30">Past 30 Days</SelectItem>
                <SelectItem value="past90">Past 90 Days</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* All Appraisals Tab */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            {filteredAppraisals.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No appraisals found</h3>
                <p className="mt-2 text-center text-muted-foreground max-w-md">
                  {searchQuery || statusFilter || propertyFilter || dateFilter !== 'all'
                    ? "No appraisals match your current filters. Try adjusting your search or filter criteria."
                    : "You don't have any appraisals yet. Appraisals will appear here once you request them for your properties."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Valuation</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppraisals.map((appraisal) => (
                    <TableRow key={appraisal.id}>
                      <TableCell>
                        <div className="font-medium">{appraisal.propertyAddress}</div>
                        <div className="text-sm text-muted-foreground">
                          {appraisal.propertyCity}, {appraisal.propertyState}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(appraisal.status)}>
                          {appraisal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{format(appraisal.date, 'MMM d, yyyy')}</div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {getDateLabel(appraisal)} {formatDistanceToNow(appraisal.date, { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {appraisal.value ? (
                          <div>
                            <div className="font-medium">${appraisal.value.toLocaleString()}</div>
                            {appraisal.changePercentage && (
                              <div className={`text-xs flex items-center ${appraisal.changePercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {appraisal.changePercentage > 0 ? '↑' : '↓'} {Math.abs(appraisal.changePercentage).toFixed(1)}% from previous
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Pending</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {appraisal.agent ? (
                          <div className="font-medium">{appraisal.agent.name}</div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link to={`/dashboard/appraisals/${appraisal.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/dashboard/properties/${appraisal.propertyId}`}>
                                <Home className="mr-2 h-4 w-4" />
                                View Property
                              </Link>
                            </DropdownMenuItem>
                            {appraisal.status === 'In Progress' && (
                              <DropdownMenuItem asChild>
                                <Link to={`/dashboard/appraisals/${appraisal.id}/update-request`}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Request Update
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {appraisal.hasReport && (
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download Report
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Active Appraisals Tab */}
        <TabsContent value="active" className="space-y-6">
          <div className="grid gap-4">
            {appraisalsByStatus.active.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Clock className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No active appraisals</h3>
                  <p className="mt-2 text-center text-muted-foreground">
                    You don't have any active appraisals at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              appraisalsByStatus.active.map(appraisal => (
                <Card key={appraisal.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{appraisal.propertyAddress}</CardTitle>
                        <CardDescription>{appraisal.propertyCity}, {appraisal.propertyState}</CardDescription>
                      </div>
                      <Badge className={getStatusBadgeClass(appraisal.status)}>
                        {appraisal.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">{getDateLabel(appraisal)}</Label>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{format(appraisal.date, 'MMMM d, yyyy')}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Appraiser</Label>
                        <div className="font-medium">
                          {appraisal.agent ? appraisal.agent.name : 'Not assigned yet'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardContent className="bg-muted/30 py-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Requested {formatDistanceToNow(appraisal.requestDate, { addSuffix: true })}
                      </span>
                      <Button asChild variant="ghost" size="sm" className="text-sm">
                        <Link to={`/dashboard/appraisals/${appraisal.id}`}>
                          View Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Completed Appraisals Tab */}
        <TabsContent value="completed" className="space-y-6">
          <div className="grid gap-4">
            {appraisalsByStatus.completed.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No completed appraisals</h3>
                  <p className="mt-2 text-center text-muted-foreground">
                    You don't have any completed appraisals yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              appraisalsByStatus.completed.map(appraisal => (
                <Card key={appraisal.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{appraisal.propertyAddress}</CardTitle>
                        <CardDescription>{appraisal.propertyCity}, {appraisal.propertyState}</CardDescription>
                      </div>
                      <Badge className={getStatusBadgeClass(appraisal.status)}>
                        {appraisal.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Completed on:</Label>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{format(appraisal.date, 'MMMM d, yyyy')}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Appraiser</Label>
                        <div className="font-medium">
                          {appraisal.agent?.name}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardContent className="pb-3 border-t pt-3">
                    <Label className="text-xs text-muted-foreground">Valuation</Label>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-2xl font-bold">${appraisal.value?.toLocaleString()}</div>
                      {appraisal.changePercentage && (
                        <div className={`text-sm flex items-center ${appraisal.changePercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {appraisal.changePercentage > 0 ? '↑' : '↓'} {Math.abs(appraisal.changePercentage).toFixed(1)}%
                          <span className="text-xs text-muted-foreground ml-1">from previous</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardContent className="bg-muted/30 py-3 border-t">
                    <div className="flex justify-between items-center">
                      <Button variant="ghost" size="sm" className="text-sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="text-sm">
                        <Link to={`/dashboard/appraisals/${appraisal.id}`}>
                          View Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerAppraisals; 