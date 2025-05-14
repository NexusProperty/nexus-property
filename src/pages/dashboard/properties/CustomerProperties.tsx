import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Search, PlusCircle, Filter, MoreVertical, Home, Building, MapPin, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

// Define property types
interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: 'Residential' | 'Commercial' | 'Land';
  status: 'Active' | 'Pending' | 'Inactive';
  lastAppraisalDate?: Date;
  lastAppraisalValue?: number;
  dateAdded: Date;
}

const CustomerProperties: React.FC = () => {
  // Mock properties data
  const [properties] = useState<Property[]>([
    {
      id: 'prop1',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      type: 'Residential',
      status: 'Active',
      lastAppraisalDate: new Date('2023-11-15'),
      lastAppraisalValue: 850000,
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
      lastAppraisalDate: new Date('2023-10-20'),
      lastAppraisalValue: 1250000,
      dateAdded: new Date('2023-03-22')
    },
    {
      id: 'prop3',
      address: '789 Sunset Boulevard',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90046',
      type: 'Residential',
      status: 'Active',
      lastAppraisalDate: new Date('2023-09-05'),
      lastAppraisalValue: 1100000,
      dateAdded: new Date('2022-12-15')
    },
    {
      id: 'prop4',
      address: '101 Market Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94103',
      type: 'Commercial',
      status: 'Inactive',
      dateAdded: new Date('2023-06-10')
    },
    {
      id: 'prop5',
      address: '555 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      zipCode: '33139',
      type: 'Land',
      status: 'Active',
      dateAdded: new Date('2023-07-28')
    }
  ]);

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Function to get icon based on property type
  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'Commercial':
        return <Building className="h-4 w-4" />;
      case 'Land':
        return <MapPin className="h-4 w-4" />;
      case 'Residential':
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  // Function to get badge color based on status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    }
  };

  // Filter properties based on search and filters
  const filteredProperties = properties.filter(property => {
    const matchesSearch = searchQuery === '' || 
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.zipCode.includes(searchQuery);
    
    const matchesType = typeFilter === '' || property.type === typeFilter;
    const matchesStatus = statusFilter === '' || property.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Properties</h1>
          <p className="text-muted-foreground">
            Manage and track the properties you've added for appraisal.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/properties/add">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Property
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by address, city or zip code..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Property Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Property Types</SelectItem>
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Land">Land</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          
          {(typeFilter !== '' || statusFilter !== '' || searchQuery !== '') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setTypeFilter('');
                setStatusFilter('');
                setSearchQuery('');
              }}
              className="md:justify-self-end"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Properties Table */}
      <Card>
        {filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="rounded-full bg-muted p-3">
              <Home className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No properties found</h3>
            <p className="mt-2 text-center text-muted-foreground">
              {searchQuery || typeFilter || statusFilter
                ? "No properties match your current filters. Try adjusting your search criteria."
                : "You haven't added any properties yet. Click 'Add New Property' to get started."}
            </p>
            {!searchQuery && !typeFilter && !statusFilter && (
              <Button asChild className="mt-4">
                <Link to="/dashboard/properties/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Property
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Appraisal</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <div className="font-medium">{property.address}</div>
                    <div className="text-sm text-muted-foreground">
                      {property.city}, {property.state} {property.zipCode}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getPropertyIcon(property.type)}
                      <span className="ml-2">{property.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(property.status)}>
                      {property.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {property.lastAppraisalDate ? (
                      <div>
                        <div className="font-medium">
                          ${property.lastAppraisalValue?.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(property.lastAppraisalDate, { addSuffix: true })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not appraised</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(property.dateAdded, { addSuffix: true })}
                    </div>
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
                          <Link to={`/dashboard/properties/${property.id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {property.lastAppraisalDate && (
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/appraisals/property/${property.id}/latest`}>
                              View Latest Appraisal
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/dashboard/properties/${property.id}/request-appraisal`}>
                            Request New Appraisal
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default CustomerProperties; 