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
import { Badge } from '@/components/ui/badge';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  DollarSign,
  Download,
  FileText,
  Home,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

// Types for appraisal
interface Appraisal {
  id: string;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Requested';
  requestDate: Date;
  scheduledDate?: Date;
  completionDate?: Date;
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  agent?: {
    name: string;
    email: string;
    phone: string;
  };
  valuation?: {
    value: number;
    previousValue?: number;
    changePercentage?: number;
    date: Date;
  };
  notes?: string;
  hasReport: boolean;
}

const CustomerAppraisalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data fetch
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockAppraisal: Appraisal = {
        id: id || 'apr1',
        status: 'Completed',
        requestDate: new Date('2023-11-01'),
        scheduledDate: new Date('2023-11-10'),
        completionDate: new Date('2023-11-15'),
        property: {
          id: 'prop1',
          address: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
        },
        agent: {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '(555) 123-4567',
        },
        valuation: {
          value: 850000,
          previousValue: 820000,
          changePercentage: 3.66,
          date: new Date('2023-11-15'),
        },
        notes: 'This property is in excellent condition with recent kitchen renovations that have added significant value. The neighborhood has seen consistent appreciation over the past 18 months.',
        hasReport: true,
      };
      
      setAppraisal(mockAppraisal);
      setIsLoading(false);
    }, 800);
  }, [id]);

  // Function to get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'Requested':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading appraisal details...</p>
        </div>
      </div>
    );
  }

  if (!appraisal) {
    return (
      <div className="text-center p-8">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="mt-4 text-lg font-semibold">Appraisal not found</h3>
        <p className="mt-2 text-muted-foreground">
          The appraisal you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button asChild className="mt-4">
          <Link to="/dashboard/appraisals">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Appraisals
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
              <Link to="/dashboard/appraisals">My Appraisals</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Appraisal Details</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className={getStatusBadgeClass(appraisal.status)}>
              {appraisal.status}
            </Badge>
            {appraisal.hasReport && (
              <Badge variant="outline">Report Available</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{appraisal.property.address}</h1>
          <p className="text-muted-foreground">
            {appraisal.property.city}, {appraisal.property.state} {appraisal.property.zipCode}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="outline">
            <Link to={`/dashboard/properties/${appraisal.property.id}`}>
              <Home className="mr-2 h-4 w-4" />
              View Property
            </Link>
          </Button>
          {appraisal.hasReport && (
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Valuation Card */}
        {appraisal.valuation && (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Property Valuation</CardTitle>
              <CardDescription>
                Current estimated value based on market analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center py-6 space-y-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <DollarSign className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary">
                    ${appraisal.valuation.value.toLocaleString()}
                  </div>
                  {appraisal.valuation.previousValue && (
                    <div className={`mt-2 flex items-center justify-center ${appraisal.valuation.changePercentage && appraisal.valuation.changePercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <ArrowUpDown className="mr-1 h-4 w-4" />
                      <span>
                        {appraisal.valuation.changePercentage ? 
                          `${Math.abs(appraisal.valuation.changePercentage).toFixed(1)}% from previous` : 
                          'Change from previous'}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 text-sm text-muted-foreground">
                    Valuation as of {format(appraisal.valuation.date, 'MMMM d, yyyy')}
                  </div>
                </div>
              </div>
            </CardContent>
            {appraisal.notes && (
              <>
                <Separator />
                <CardContent className="py-4">
                  <p className="text-muted-foreground">{appraisal.notes}</p>
                </CardContent>
              </>
            )}
          </Card>
        )}

        {/* Appraiser Information */}
        {appraisal.agent && (
          <Card>
            <CardHeader>
              <CardTitle>Your Appraiser</CardTitle>
              <CardDescription>Contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="font-medium">{appraisal.agent.name}</div>
                  <div className="text-sm text-muted-foreground">{appraisal.agent.email}</div>
                  <div className="text-sm text-muted-foreground">{appraisal.agent.phone}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appraisal Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Appraisal Status</CardTitle>
            <CardDescription>Current status of your property appraisal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-1.5 mr-3">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Appraisal Requested</div>
                  <div className="text-sm text-muted-foreground">
                    {format(appraisal.requestDate, 'MMMM d, yyyy')}
                  </div>
                </div>
              </div>

              {appraisal.scheduledDate && (
                <div className="flex items-center">
                  <div className={`rounded-full ${appraisal.status !== 'Requested' ? 'bg-green-100' : 'bg-gray-100'} p-1.5 mr-3`}>
                    <Calendar className={`h-4 w-4 ${appraisal.status !== 'Requested' ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="font-medium">Property Inspection</div>
                    <div className="text-sm text-muted-foreground">
                      {format(appraisal.scheduledDate, 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
              )}

              {appraisal.completionDate && (
                <div className="flex items-center">
                  <div className={`rounded-full ${appraisal.status === 'Completed' ? 'bg-green-100' : 'bg-gray-100'} p-1.5 mr-3`}>
                    <DollarSign className={`h-4 w-4 ${appraisal.status === 'Completed' ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="font-medium">Appraisal Completed</div>
                    <div className="text-sm text-muted-foreground">
                      {format(appraisal.completionDate, 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {appraisal.status === 'In Progress' && (
        <Card className="bg-muted/20">
          <CardContent className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
            <div>
              <h3 className="font-medium">Need an update?</h3>
              <p className="text-sm text-muted-foreground">
                You can request an update on your appraisal progress.
              </p>
            </div>
            <Button asChild>
              <Link to={`/dashboard/appraisals/${appraisal.id}/update-request`}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Request Update
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerAppraisalDetail; 