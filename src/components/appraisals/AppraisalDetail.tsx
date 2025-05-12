import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAppraisalWithComparables, deleteAppraisal, getAppraisalReport } from '@/services/appraisal';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/types/supabase';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Download,
  FileText,
  Trash, 
  Edit,
  Home,
  Building,
  Building2,
  Warehouse,
  Landmark,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

type Appraisal = Database['public']['Tables']['appraisals']['Row'];
type ComparableProperty = Database['public']['Tables']['comparable_properties']['Row'];

export function AppraisalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [comparables, setComparables] = useState<ComparableProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch appraisal data
  useEffect(() => {
    if (!id) return;

    const fetchAppraisal = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getAppraisalWithComparables(id);
        if (result.success && result.data) {
          setAppraisal(result.data.appraisal);
          setComparables(result.data.comparables);
        } else {
          setError(result.error || 'Failed to load appraisal');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppraisal();
  }, [id]);

  // Handle appraisal deletion
  const handleDeleteAppraisal = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    
    try {
      const result = await deleteAppraisal(id);
      
      if (result.success) {
        toast({
          title: 'Appraisal Deleted',
          description: 'The appraisal has been deleted successfully',
        });
        
        navigate('/dashboard/appraisals');
      } else {
        throw new Error(result.error || 'Failed to delete appraisal');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Handle report download
  const handleDownloadReport = async () => {
    if (!id) return;
    
    setIsGeneratingReport(true);
    
    try {
      const result = await getAppraisalReport(id);
      
      if (result.success && result.data) {
        // Open the report URL in a new tab
        window.open(result.data, '_blank');
      } else {
        throw new Error(result.error || 'Failed to get report');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  // Property type icon mapping
  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'house':
        return <Home className="h-5 w-5" />;
      case 'apartment':
        return <Building2 className="h-5 w-5" />;
      case 'townhouse':
        return <Building className="h-5 w-5" />;
      case 'land':
        return <Landmark className="h-5 w-5" />;
      case 'commercial':
        return <Warehouse className="h-5 w-5" />;
      default:
        return <Home className="h-5 w-5" />;
    }
  };

  // Format price
  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return `$${price.toLocaleString()}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !appraisal) {
    return (
      <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Appraisal not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/appraisals')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Appraisals
          </Button>
          
          <h2 className="text-2xl font-bold">{appraisal.property_address}</h2>
        </div>
        
        <div className="flex space-x-2">
          {appraisal.status === 'completed' && (
            <Button
              variant="outline"
              onClick={handleDownloadReport}
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </>
              )}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/appraisals/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Appraisal</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this appraisal? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAppraisal}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Appraisal'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Appraisal details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Appraisal details */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Appraisal Results</CardTitle>
                <Badge className={getStatusBadgeColor(appraisal.status)}>
                  {getStatusIcon(appraisal.status)}
                  <span className="ml-1 capitalize">{appraisal.status}</span>
                </Badge>
              </div>
              <CardDescription>
                {appraisal.property_suburb}, {appraisal.property_city}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Valuation */}
              <div>
                <h3 className="text-lg font-medium mb-2">Valuation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm text-gray-500">Low Estimate</div>
                    <div className="text-2xl font-bold">
                      {formatPrice(appraisal.valuation_low)}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm text-gray-500">High Estimate</div>
                    <div className="text-2xl font-bold">
                      {formatPrice(appraisal.valuation_high)}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Tabs for different sections */}
              <Tabs defaultValue="market">
                <TabsList>
                  <TabsTrigger value="market">Market Analysis</TabsTrigger>
                  <TabsTrigger value="property">Property Details</TabsTrigger>
                  <TabsTrigger value="comparables">Comparable Sales</TabsTrigger>
                </TabsList>
                
                {/* Market Analysis Tab */}
                <TabsContent value="market" className="space-y-4 mt-4">
                  {appraisal.market_analysis ? (
                    <div className="prose max-w-none">
                      <h3>Market Analysis</h3>
                      <p>{appraisal.market_analysis}</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded text-yellow-800">
                      <h3 className="font-medium">Market Analysis Not Available</h3>
                      <p className="text-sm mt-1">
                        Market analysis will be available once the appraisal is completed.
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                {/* Property Details Tab */}
                <TabsContent value="property" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                    <div>
                      <div className="text-sm text-gray-500">Property Type</div>
                      <div className="flex items-center font-medium">
                        <div className="mr-2">
                          {getPropertyTypeIcon(appraisal.property_type)}
                        </div>
                        <span className="capitalize">{appraisal.property_type}</span>
                      </div>
                    </div>
                    
                    {appraisal.bedrooms !== null && (
                      <div>
                        <div className="text-sm text-gray-500">Bedrooms</div>
                        <div className="font-medium">{appraisal.bedrooms}</div>
                      </div>
                    )}
                    
                    {appraisal.bathrooms !== null && (
                      <div>
                        <div className="text-sm text-gray-500">Bathrooms</div>
                        <div className="font-medium">{appraisal.bathrooms}</div>
                      </div>
                    )}
                    
                    {appraisal.land_size !== null && (
                      <div>
                        <div className="text-sm text-gray-500">Land Size</div>
                        <div className="font-medium">{appraisal.land_size}m²</div>
                      </div>
                    )}
                  </div>
                  
                  {appraisal.property_description ? (
                    <div className="mt-4">
                      <h3 className="text-lg font-medium mb-2">Property Description</h3>
                      <p>{appraisal.property_description}</p>
                    </div>
                  ) : null}
                </TabsContent>
                
                {/* Comparable Properties Tab */}
                <TabsContent value="comparables" className="space-y-4 mt-4">
                  {comparables && comparables.length > 0 ? (
                    <>
                      <div className="text-sm text-gray-500 mb-2">
                        {comparables.length} comparable properties found
                      </div>
                      
                      {appraisal.comparables_commentary && (
                        <div className="bg-gray-50 p-4 rounded mb-4">
                          <h3 className="font-medium">Comparables Analysis</h3>
                          <p className="text-sm mt-1">{appraisal.comparables_commentary}</p>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        {comparables.map((comparable) => (
                          <Card key={comparable.id}>
                            <div className="flex flex-col md:flex-row">
                              {/* Image column */}
                              <div className="md:w-1/4">
                                {comparable.image_url ? (
                                  <div className="aspect-square md:h-full">
                                    <img
                                      src={comparable.image_url}
                                      alt={comparable.address}
                                      className="w-full h-full object-cover md:rounded-l-lg"
                                    />
                                  </div>
                                ) : (
                                  <div className="aspect-square md:h-full bg-gray-100 flex items-center justify-center md:rounded-l-lg">
                                    <Home className="h-12 w-12 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Details column */}
                              <CardContent className="md:w-3/4 p-4">
                                <h3 className="font-medium">{comparable.address}</h3>
                                <p className="text-sm text-gray-500">{comparable.suburb}, {comparable.city}</p>
                                
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                                  {comparable.sale_price !== null && (
                                    <div>
                                      <div className="text-xs text-gray-500">Sale Price</div>
                                      <div className="font-medium">{formatPrice(comparable.sale_price)}</div>
                                    </div>
                                  )}
                                  
                                  {comparable.sale_date !== null && (
                                    <div>
                                      <div className="text-xs text-gray-500">Sale Date</div>
                                      <div className="font-medium">{new Date(comparable.sale_date).toLocaleDateString()}</div>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <div className="text-xs text-gray-500">Property Type</div>
                                    <div className="font-medium capitalize">{comparable.property_type}</div>
                                  </div>
                                  
                                  {comparable.bedrooms !== null && (
                                    <div>
                                      <div className="text-xs text-gray-500">Bedrooms</div>
                                      <div className="font-medium">{comparable.bedrooms}</div>
                                    </div>
                                  )}
                                  
                                  {comparable.bathrooms !== null && (
                                    <div>
                                      <div className="text-xs text-gray-500">Bathrooms</div>
                                      <div className="font-medium">{comparable.bathrooms}</div>
                                    </div>
                                  )}
                                  
                                  {comparable.land_size !== null && (
                                    <div>
                                      <div className="text-xs text-gray-500">Land Size</div>
                                      <div className="font-medium">{comparable.land_size}m²</div>
                                    </div>
                                  )}
                                  
                                  {comparable.distance_km !== null && (
                                    <div>
                                      <div className="text-xs text-gray-500">Distance</div>
                                      <div className="font-medium">{comparable.distance_km.toFixed(1)} km</div>
                                    </div>
                                  )}
                                  
                                  {comparable.similarity_score !== null && (
                                    <div>
                                      <div className="text-xs text-gray-500">Similarity</div>
                                      <div className="font-medium">{(comparable.similarity_score * 100).toFixed(0)}%</div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-1">No comparable properties available</h3>
                      <p className="text-sm text-gray-400">
                        Comparable properties will be available once the appraisal is completed
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Appraisal summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Appraisal Summary</CardTitle>
              <CardDescription>Created on {new Date(appraisal.created_at).toLocaleDateString()}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm">Status</div>
                <Badge className={getStatusBadgeColor(appraisal.status)}>
                  {appraisal.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">Property Type</div>
                <div className="flex items-center">
                  {getPropertyTypeIcon(appraisal.property_type)}
                  <span className="ml-1 capitalize">{appraisal.property_type}</span>
                </div>
              </div>
              
              {appraisal.property_id && (
                <div className="flex justify-between items-center">
                  <div className="text-sm">Linked Property</div>
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate(`/dashboard/properties/${appraisal.property_id}`)}
                  >
                    View Property
                  </Button>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-sm">Created</div>
                <div>{new Date(appraisal.created_at).toLocaleDateString()}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">Last Updated</div>
                <div>{new Date(appraisal.updated_at).toLocaleDateString()}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">Visibility</div>
                <div>{appraisal.is_public ? 'Public' : 'Private'}</div>
              </div>
              
              {appraisal.status === 'completed' && (
                <div className="border-t pt-4 mt-4">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={handleDownloadReport}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 