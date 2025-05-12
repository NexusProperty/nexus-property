import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAppraisalWithComparables, deleteAppraisal, getAppraisalReport } from '@/services/appraisal';
import { updateAppraisalWithPropertyData } from '@/services/property-data';
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
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  RefreshCw,
  DollarSign,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Base types from the database
type BaseAppraisal = Database['public']['Tables']['appraisals']['Row'];
type BaseComparableProperty = Database['public']['Tables']['comparable_properties']['Row'];

// Extended types with additional properties
interface Appraisal extends BaseAppraisal {
  property_description?: string;
  market_analysis?: string;
  comparables_commentary?: string;
  is_public?: boolean;
}

interface ComparableProperty extends BaseComparableProperty {
  distance_km?: number;
}

// ValuationRangeVisual component for displaying the valuation range graphically
interface ValuationRangeVisualProps {
  low: number | null;
  high: number | null;
  comparables: ComparableProperty[];
}

function ValuationRangeVisual({ low, high, comparables }: ValuationRangeVisualProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!low && !high) {
    return (
      <div className="bg-gray-50 p-4 rounded text-center">
        <p className="text-gray-500">Valuation range not available yet</p>
      </div>
    );
  }
  
  // Calculate the range and buffer
  const minValue = low || 0;
  const maxValue = high || 0;
  const range = maxValue - minValue;
  const buffer = range * 0.2; // 20% buffer on each side for visual spacing
  
  // Find min and max from comparable properties
  const comparablePrices = comparables
    .filter(comp => comp.sale_price !== null)
    .map(comp => comp.sale_price as number);
  
  const minComparable = comparablePrices.length ? Math.min(...comparablePrices) : null;
  const maxComparable = comparablePrices.length ? Math.max(...comparablePrices) : null;
  
  // Calculate chart range with buffer
  const chartMin = Math.min(minValue, minComparable || minValue) - buffer;
  const chartMax = Math.max(maxValue, maxComparable || maxValue) + buffer;
  const chartRange = chartMax - chartMin;
  
  // Calculate position percentages for the range
  const lowPercent = ((minValue - chartMin) / chartRange) * 100;
  const highPercent = ((maxValue - chartMin) / chartRange) * 100;
  const rangeWidth = highPercent - lowPercent;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <div className="bg-gray-50 p-4 rounded">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-lg">Valuation Range</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              More
            </>
          )}
        </Button>
      </div>
      
      <div className="relative h-10 mb-1">
        {/* Background track */}
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full transform -translate-y-1/2"></div>
        
        {/* Valuation range */}
        <div 
          className="absolute top-1/2 h-2 bg-green-500 rounded-full transform -translate-y-1/2"
          style={{ 
            left: `${lowPercent}%`, 
            width: `${rangeWidth}%` 
          }}
        ></div>
        
        {/* Low value indicator */}
        <div 
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${lowPercent}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-4 h-4 bg-green-700 rounded-full border-2 border-white"></div>
          <span className="text-sm font-medium mt-1">{formatCurrency(minValue)}</span>
        </div>
        
        {/* High value indicator */}
        <div 
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${highPercent}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-4 h-4 bg-green-700 rounded-full border-2 border-white"></div>
          <span className="text-sm font-medium mt-1">{formatCurrency(maxValue)}</span>
        </div>
      </div>
      
      {/* Expanded details */}
      {isExpanded && comparablePrices.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Comparable Sales</h4>
          <div className="relative h-24 mb-2">
            {/* Background track */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full transform -translate-y-1/2"></div>
            
            {/* Valuation range */}
            <div 
              className="absolute top-1/2 h-1 bg-green-200 rounded-full transform -translate-y-1/2"
              style={{ 
                left: `${lowPercent}%`, 
                width: `${rangeWidth}%` 
              }}
            ></div>
            
            {/* Comparable property indicators */}
            {comparables
              .filter(comp => comp.sale_price !== null)
              .map((comp, index) => {
                const salePrice = comp.sale_price as number;
                const position = ((salePrice - chartMin) / chartRange) * 100;
                const isInRange = salePrice >= minValue && salePrice <= maxValue;
                
                return (
                  <div 
                    key={comp.id} 
                    className="absolute flex flex-col items-center cursor-pointer group"
                    style={{ 
                      left: `${position}%`, 
                      top: 0,
                      transform: 'translateX(-50%)'
                    }}
                    title={`${comp.address}: ${formatCurrency(salePrice)}`}
                  >
                    <div className={`w-3 h-3 rounded-full border border-gray-400 ${
                      isInRange ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="text-xs opacity-0 group-hover:opacity-100 absolute top-4 bg-gray-800 text-white p-1 rounded whitespace-nowrap">
                      {formatCurrency(salePrice)}
                    </div>
                  </div>
                );
              })
            }
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatCurrency(chartMin)}</span>
            <span>{formatCurrency(chartMax)}</span>
          </div>
          
          <div className="flex items-center mt-3 gap-3 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span>In range</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
              <span>Outside range</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppraisalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [comparables, setComparables] = useState<ComparableProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Fetch appraisal data
  const fetchAppraisal = async () => {
    if (!id) return;
    
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
      console.error('Error loading appraisal:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load appraisal on mount
  useEffect(() => {
    fetchAppraisal();
  }, [id]);

  // Handle fetching property data
  const handleFetchPropertyData = async () => {
    if (!appraisal || !id) return;
    
    setIsProcessing(true);
    
    try {
      const propertyData = {
        address: appraisal.property_address,
        suburb: appraisal.property_suburb,
        city: appraisal.property_city,
        propertyType: appraisal.property_type,
      };
      
      const result = await updateAppraisalWithPropertyData(id, propertyData);
      
      if (result.success) {
        toast({
          title: 'Property Data Fetched',
          description: 'Property data has been fetched and the appraisal is being processed.',
        });
        
        // Refresh the appraisal data
        fetchAppraisal();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to fetch property data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching property data:', error);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle appraisal deletion
  const handleDeleteAppraisal = async () => {
    if (!id) return;
    
    setIsProcessing(true);
    
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
      setIsProcessing(false);
      setIsDeleteDialogOpen(false);
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
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAppraisal}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
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
              
              {/* Add valuation range visualization */}
              {appraisal.status === 'completed' && (
                <div className="mb-6">
                  <ValuationRangeVisual 
                    low={appraisal.valuation_low} 
                    high={appraisal.valuation_high}
                    comparables={comparables}
                  />
                </div>
              )}
              
              {/* Tabs for different sections */}
              <Tabs defaultValue="market">
                <TabsList>
                  <TabsTrigger value="market">Market Analysis</TabsTrigger>
                  <TabsTrigger value="property">Property Details</TabsTrigger>
                  <TabsTrigger value="comparables">Comparable Sales</TabsTrigger>
                </TabsList>
                
                {/* Market Analysis Tab */}
                <TabsContent value="market" className="space-y-6 mt-4">
                  {appraisal.status === 'completed' ? (
                    <>
                      {/* Market metrics cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-gray-500 mb-1">Market Confidence</div>
                            <div className="flex items-center">
                              <div className="text-2xl font-bold mr-2">
                                {appraisal.valuation_confidence ? `${(appraisal.valuation_confidence * 100).toFixed(0)}%` : 'N/A'}
                              </div>
                              {appraisal.valuation_confidence && (
                                <div className={`text-xs px-2 py-1 rounded ${
                                  appraisal.valuation_confidence > 0.8 ? 'bg-green-100 text-green-800' :
                                  appraisal.valuation_confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {appraisal.valuation_confidence > 0.8 ? 'High' :
                                   appraisal.valuation_confidence > 0.6 ? 'Medium' : 'Low'}
                                </div>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Based on {comparables.length} comparable properties
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-gray-500 mb-1">Value Range</div>
                            <div className="text-2xl font-bold">
                              {appraisal.valuation_high && appraisal.valuation_low ? 
                                `${(((appraisal.valuation_high - appraisal.valuation_low) / appraisal.valuation_low) * 100).toFixed(0)}%` : 'N/A'}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Spread between low and high estimates
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-gray-500 mb-1">Price per m²</div>
                            <div className="text-2xl font-bold">
                              {appraisal.land_size && appraisal.valuation_high && appraisal.valuation_low ? 
                                `$${(((appraisal.valuation_high + appraisal.valuation_low) / 2) / appraisal.land_size).toLocaleString(undefined, {maximumFractionDigits: 0})}` : 'N/A'}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Based on average valuation
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Market analysis */}
                      {appraisal.market_analysis ? (
                        <div>
                          <h3 className="text-lg font-medium mb-3">Market Analysis</h3>
                          <div className="prose max-w-none bg-white p-4 rounded border">
                            <p>{appraisal.market_analysis}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 p-4 rounded text-yellow-800">
                          <h3 className="font-medium">Market Analysis Not Available</h3>
                          <p className="text-sm mt-1">
                            Detailed market analysis is not available for this appraisal.
                          </p>
                        </div>
                      )}
                      
                      {/* Property value factors */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">Value Influencing Factors</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Positive Factors</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>Close proximity to local amenities</li>
                                <li>Recent renovations enhancing value</li>
                                <li>Strong demand in this suburb</li>
                                <li>Good school zone</li>
                                <li>Above average land size for the area</li>
                              </ul>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Areas for Consideration</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>Property may require some maintenance</li>
                                <li>Limited parking availability</li>
                                <li>Increased supply of similar properties</li>
                                <li>Market showing signs of cooling</li>
                              </ul>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      {/* Market trends */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">Local Market Trends</h3>
                        <div className="bg-white p-4 rounded border">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-sm text-gray-500">Annual Growth</div>
                              <div className="font-medium text-green-600">+5.2%</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Median Price</div>
                              <div className="font-medium">$875,000</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Avg. Days on Market</div>
                              <div className="font-medium">32 days</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Sales Volume</div>
                              <div className="font-medium">+8% YoY</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 p-6 rounded text-yellow-800 text-center">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                      <h3 className="font-medium">Market Analysis Not Available</h3>
                      <p className="text-sm mt-1 max-w-md mx-auto">
                        Market analysis will be available once the appraisal is completed. 
                        The system is currently {appraisal.status === 'processing' ? 'processing' : 'waiting to process'} this appraisal.
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
      
      <CardFooter className="flex justify-between border-t pt-5">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/appraisals')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Appraisals
        </Button>
        
        <div className="flex gap-2">
          {appraisal?.status === 'pending' && (
            <Button 
              onClick={handleFetchPropertyData}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Fetch Property Data
                </>
              )}
            </Button>
          )}
          
          {appraisal?.status === 'completed' && (
            <Button 
              onClick={handleDownloadReport}
              disabled={!appraisal.report_url}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          )}
          
          <Button 
            variant="ghost"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </div>
  );
} 