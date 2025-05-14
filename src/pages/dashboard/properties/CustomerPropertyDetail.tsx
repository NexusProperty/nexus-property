import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  Edit,
  Home,
  Info,
  MapPin,
  Pencil,
  FileText,
  Building,
  Clock3,
  Wallet
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

// Types for our property details
interface PropertyDetail {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: 'Residential' | 'Commercial' | 'Land';
  status: 'Active' | 'Pending' | 'Inactive';
  description?: string;
  squareFootage?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: string;
  amenities?: string[];
  dateAdded: Date;
  lastAppraisal?: {
    id: string;
    date: Date;
    value: number;
    previousValue?: number;
    changePercentage?: number;
  };
  appraisalHistory?: {
    id: string;
    date: Date;
    value: number;
    agent: string;
    status: string;
  }[];
}

const CustomerPropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock property fetch
  useEffect(() => {
    // Simulating API call
    const fetchPropertyDetails = () => {
      setIsLoading(true);
      // Mock data
      setTimeout(() => {
        const mockProperty: PropertyDetail = {
          id: id || 'prop1',
          address: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          type: 'Residential',
          status: 'Active',
          description: 'A beautifully maintained home in the heart of the city with modern amenities and great natural light.',
          squareFootage: 2200,
          yearBuilt: 2005,
          bedrooms: 3,
          bathrooms: 2.5,
          lotSize: '0.25 acres',
          amenities: ['Garage', 'Fireplace', 'Updated Kitchen', 'Hardwood Floors', 'Backyard'],
          dateAdded: new Date('2023-01-10'),
          lastAppraisal: {
            id: 'apr1',
            date: new Date('2023-11-15'),
            value: 850000,
            previousValue: 820000,
            changePercentage: 3.66
          },
          appraisalHistory: [
            {
              id: 'apr1',
              date: new Date('2023-11-15'),
              value: 850000,
              agent: 'John Smith',
              status: 'Completed'
            },
            {
              id: 'apr2',
              date: new Date('2022-12-20'),
              value: 820000,
              agent: 'Sarah Johnson',
              status: 'Completed'
            },
            {
              id: 'apr3',
              date: new Date('2021-10-05'),
              value: 785000,
              agent: 'Michael Brown',
              status: 'Completed'
            }
          ]
        };
        
        setProperty(mockProperty);
        setIsLoading(false);
      }, 500);
    };

    fetchPropertyDetails();
  }, [id]);

  // Function to get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Function to get property icon
  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'Commercial':
        return <Building className="h-5 w-5" />;
      case 'Land':
        return <MapPin className="h-5 w-5" />;
      case 'Residential':
      default:
        return <Home className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center p-8">
        <div className="rounded-full bg-red-100 p-3 mx-auto w-fit">
          <Info className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Property not found</h3>
        <p className="mt-2 text-muted-foreground">
          The property you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button asChild className="mt-4">
          <Link to="/dashboard/properties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard/properties">My Properties</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className="truncate max-w-[200px] inline-block">
              {property.address}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Property Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="rounded-full bg-muted p-1.5">
              {getPropertyIcon(property.type)}
            </div>
            <Badge className={getStatusBadgeClass(property.status)}>
              {property.status}
            </Badge>
            <Badge variant="outline">{property.type}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{property.address}</h1>
          <p className="text-muted-foreground">
            {property.city}, {property.state} {property.zipCode}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="outline">
            <Link to={`/dashboard/properties/${property.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Property
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/dashboard/properties/${property.id}/request-appraisal`}>
              <Wallet className="mr-2 h-4 w-4" />
              Request Appraisal
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs for different property views */}
      <Tabs defaultValue="details" className="w-full space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="appraisals">Appraisal History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Property Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Property Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Property Overview</CardTitle>
                <CardDescription>Key details about this property</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {property.squareFootage && (
                    <>
                      <dt className="text-muted-foreground">Square Footage</dt>
                      <dd className="font-medium">{property.squareFootage.toLocaleString()} sq ft</dd>
                    </>
                  )}
                  {property.yearBuilt && (
                    <>
                      <dt className="text-muted-foreground">Year Built</dt>
                      <dd className="font-medium">{property.yearBuilt}</dd>
                    </>
                  )}
                  {property.bedrooms && (
                    <>
                      <dt className="text-muted-foreground">Bedrooms</dt>
                      <dd className="font-medium">{property.bedrooms}</dd>
                    </>
                  )}
                  {property.bathrooms && (
                    <>
                      <dt className="text-muted-foreground">Bathrooms</dt>
                      <dd className="font-medium">{property.bathrooms}</dd>
                    </>
                  )}
                  {property.lotSize && (
                    <>
                      <dt className="text-muted-foreground">Lot Size</dt>
                      <dd className="font-medium">{property.lotSize}</dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">Added to System</dt>
                  <dd className="font-medium">{format(property.dateAdded, 'MMM d, yyyy')}</dd>
                </dl>
              </CardContent>
            </Card>

            {/* Current Valuation Card */}
            <Card>
              <CardHeader>
                <CardTitle>Current Valuation</CardTitle>
                <CardDescription>Latest appraisal information</CardDescription>
              </CardHeader>
              <CardContent>
                {property.lastAppraisal ? (
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-primary">
                      ${property.lastAppraisal.value.toLocaleString()}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-1 h-4 w-4" />
                      Appraised on {format(property.lastAppraisal.date, 'MMMM d, yyyy')}
                    </div>
                    {property.lastAppraisal.changePercentage && (
                      <div className={`flex items-center text-sm ${property.lastAppraisal.changePercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className={`mr-1 ${property.lastAppraisal.changePercentage > 0 ? 'rotate-0' : 'rotate-180'}`}>↑</div>
                        {Math.abs(property.lastAppraisal.changePercentage).toFixed(1)}% from previous appraisal
                      </div>
                    )}
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to={`/dashboard/appraisals/property/${property.id}/latest`}>
                        View Complete Appraisal
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Wallet className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
                    <h3 className="mt-2 font-medium">No appraisals yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground mb-4">
                      This property hasn't been appraised yet.
                    </p>
                    <Button asChild>
                      <Link to={`/dashboard/properties/${property.id}/request-appraisal`}>
                        Request Appraisal
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description Card */}
            {property.description && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{property.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Amenities Card */}
            {property.amenities && property.amenities.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Amenities & Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {property.amenities.map((amenity, index) => (
                      <li key={index} className="flex items-center">
                        <div className="rounded-full bg-primary/10 p-1 mr-2">
                          <CheckIcon className="h-3 w-3 text-primary" />
                        </div>
                        {amenity}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Appraisal History Tab */}
        <TabsContent value="appraisals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appraisal History</CardTitle>
              <CardDescription>Track your property's value over time</CardDescription>
            </CardHeader>
            <CardContent>
              {property.appraisalHistory && property.appraisalHistory.length > 0 ? (
                <ScrollArea className="h-[400px] rounded-md border p-2">
                  <div className="relative">
                    <div className="absolute top-0 bottom-0 left-5 w-0.5 bg-gray-200"></div>
                    <ul className="space-y-4 relative">
                      {property.appraisalHistory.map((appraisal) => (
                        <li key={appraisal.id} className="ms-10 relative">
                          <div className="absolute -left-10 mt-1.5 h-5 w-5 rounded-full border border-white bg-primary flex items-center justify-center">
                            <Clock3 className="h-3 w-3 text-white" />
                          </div>
                          <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-semibold">
                                  ${appraisal.value.toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {format(appraisal.date, 'MMMM d, yyyy')}
                                </div>
                              </div>
                              <Badge 
                                className={appraisal.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                              >
                                {appraisal.status}
                              </Badge>
                            </div>
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Appraiser: </span>
                              <span>{appraisal.agent}</span>
                            </div>
                            <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0">
                              <Link to={`/dashboard/appraisals/${appraisal.id}`}>
                                View full appraisal
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-10">
                  <Wallet className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
                  <h3 className="mt-2 font-medium">No appraisal history</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This property hasn't been appraised yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Documents</CardTitle>
              <CardDescription>Access and manage documents related to your property</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
                <h3 className="mt-2 font-medium">No documents available</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your property documents will appear here once they are added by your agent.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Simple check icon for amenities
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 12l5 5l10 -10" />
  </svg>
);

export default CustomerPropertyDetail; 