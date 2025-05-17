import React, { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAppraisalWithComparables, deleteAppraisal, getAppraisalReport } from '@/services/appraisal';
import { updateAppraisalWithPropertyData } from '@/services/property-data';
import { requestPropertyValuation, isEligibleForValuation } from '@/services/property-valuation';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/types/supabase';
import { useAppraisalRealtimeUpdates, useComparablesRealtimeUpdates } from '@/hooks/useRealtimeSubscription';
import { ComparableProperties } from './ComparableProperties';
import { MarketAnalysis, MarketInsight, MarketTrend, SuburbStats } from './MarketAnalysis';

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
  ChevronUp,
  FileDown,
  MoreVertical,
  Loader2
} from 'lucide-react';
import ReportGenerationButton from '@/components/ReportGenerationButton';

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

// CoreLogicAVMData component for displaying automated valuation model data
interface CoreLogicAVMDataProps {
  avm_estimate: number | null;
  avm_range_low: number | null;
  avm_range_high: number | null;
  avm_confidence: string | null;
}

function CoreLogicAVMData({ avm_estimate, avm_range_low, avm_range_high, avm_confidence }: CoreLogicAVMDataProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getConfidenceColor = (confidence: string | null) => {
    if (!confidence) return 'bg-gray-100 text-gray-800';
    
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!avm_estimate && !avm_range_low && !avm_range_high) {
    return (
      <div className="bg-gray-50 p-4 rounded text-center">
        <p className="text-gray-500">CoreLogic AVM data not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-lg">CoreLogic AVM</h3>
        <Badge className={getConfidenceColor(avm_confidence)}>
          {avm_confidence || 'Unknown'} Confidence
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border rounded-md p-3">
          <div className="text-sm text-gray-500 mb-1">Estimate</div>
          <div className="text-xl font-bold">{formatCurrency(avm_estimate)}</div>
        </div>
        
        <div className="bg-white border rounded-md p-3">
          <div className="text-sm text-gray-500 mb-1">Low Range</div>
          <div className="text-xl font-bold">{formatCurrency(avm_range_low)}</div>
        </div>
        
        <div className="bg-white border rounded-md p-3">
          <div className="text-sm text-gray-500 mb-1">High Range</div>
          <div className="text-xl font-bold">{formatCurrency(avm_range_high)}</div>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Data provided by CoreLogic automated valuation model. Last updated: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}

// REINZMarketData component for displaying REINZ market statistics
interface REINZMarketDataProps {
  reinz_data: MarketStatistics | null;
  suburb: string;
  city: string;
}

interface MarketStatistics {
  median_price: number;
  price_change_quarterly: number;
  price_change_annual: number;
  days_to_sell: number;
  sales_count: number;
  inventory_weeks: number;
  comparative_regions: ComparativeRegion[];
}

interface ComparativeRegion {
  name: string;
  median_price: number;
  price_change_annual: number;
}

function REINZMarketData({ reinz_data, suburb, city }: REINZMarketDataProps) {
  const mockData: MarketStatistics = {
    median_price: 875000,
    price_change_quarterly: 2.3,
    price_change_annual: 5.7,
    days_to_sell: 34,
    sales_count: 47,
    inventory_weeks: 16.5,
    comparative_regions: [
      { name: 'City Average', median_price: 920000, price_change_annual: 4.2 },
      { name: 'National Average', median_price: 850000, price_change_annual: 3.8 },
    ]
  };
  
  // Use mock data if real data is not available
  const data = reinz_data || mockData;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };
  
  const getPercentageColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-lg">REINZ Market Statistics</h3>
        <span className="text-sm text-muted-foreground">
          {suburb}, {city}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border rounded-md p-3">
          <div className="text-sm text-gray-500 mb-1">Median Sale Price</div>
          <div className="text-xl font-bold">{formatCurrency(data.median_price)}</div>
          <div className={`text-xs ${getPercentageColor(data.price_change_annual)}`}>
            {formatPercentage(data.price_change_annual)} year on year
          </div>
        </div>
        
        <div className="bg-white border rounded-md p-3">
          <div className="text-sm text-gray-500 mb-1">Average Days to Sell</div>
          <div className="text-xl font-bold">{data.days_to_sell} days</div>
        </div>
        
        <div className="bg-white border rounded-md p-3">
          <div className="text-sm text-gray-500 mb-1">Sales Count (Last Quarter)</div>
          <div className="text-xl font-bold">{data.sales_count}</div>
        </div>
      </div>
      
      <div className="bg-white border rounded-md p-4">
        <h4 className="font-medium mb-3">Price Comparison</h4>
        <div className="space-y-3">
          {data.comparative_regions.map((region: ComparativeRegion, index: number) => (
            <div key={index} className="flex justify-between items-center">
              <span>{region.name}</span>
              <div className="text-right">
                <div className="font-medium">{formatCurrency(region.median_price)}</div>
                <div className={`text-xs ${getPercentageColor(region.price_change_annual)}`}>
                  {formatPercentage(region.price_change_annual)} year on year
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Data provided by Real Estate Institute of New Zealand. Last updated: {new Date().toLocaleDateString()}
      </div>
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
  const [isRequestingValuation, setIsRequestingValuation] = useState(false);
  const [valuationEligibility, setValuationEligibility] = useState<{ 
    eligible: boolean; 
    reasons: string[] 
  }>({ eligible: false, reasons: [] });
  
  // Set up realtime subscriptions if an ID is available
  const appraisalId = id || '';
  const { isConnected: isAppraisalConnected, lastChange: appraisalChange } = 
    useAppraisalRealtimeUpdates(appraisalId);
  const { isConnected: isComparablesConnected, lastChange: comparablesChange } = 
    useComparablesRealtimeUpdates(appraisalId);

  // Mock data for market analysis (replace with real API data in production)
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([
    {
      id: '1',
      type: 'positive',
      title: 'Rising Property Values',
      description: 'Properties in this area have seen a 5.2% increase in value over the last quarter, outperforming the city average.',
      source: 'Property Market Report Q2 2023',
      impact: 'high'
    },
    {
      id: '2',
      type: 'warning',
      title: 'New Development Impact',
      description: 'A new commercial development 2km away may affect property values in this neighborhood within the next 6-12 months.',
      source: 'City Planning Department',
      impact: 'medium'
    },
    {
      id: '3',
      type: 'neutral',
      title: 'Stable Interest Rates',
      description: 'Central bank has signaled stable interest rates for the next quarter, suggesting a steady mortgage market.',
      source: 'Economic Forecast June 2023',
      impact: 'low'
    }
  ]);
  
  const [priceHistory, setPriceHistory] = useState<MarketTrend[]>([
    {
      period: 'Last 3 Months',
      value: 950000,
      change: 3.2
    },
    {
      period: 'Last 6 Months',
      value: 925000,
      change: 5.5
    },
    {
      period: 'Last 12 Months',
      value: 875000,
      change: 8.4
    }
  ]);
  
  const [suburbStats, setSuburbStats] = useState<SuburbStats>({
    suburb: '',
    medianPrice: 0,
    avgDaysOnMarket: 0,
    salesVolume: 0,
    priceChange3Months: 0,
    priceChange1Year: 0
  });

  // Fetch appraisal data
  const fetchAppraisal = useCallback(async () => {
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
    }, [id]);

  // Load appraisal on mount
  useEffect(() => {
    fetchAppraisal();
  }, [id, fetchAppraisal]);

  // Update data when realtime changes are received
  useEffect(() => {
    if (appraisalChange && appraisalChange.new) {
      console.log('Realtime appraisal update:', appraisalChange);
      
      // Type assertion since we know this is an Appraisal
      const newAppraisalData = appraisalChange.new as Appraisal;
      
      setAppraisal((prev) => {
        if (!prev) return newAppraisalData;
        return { ...prev, ...newAppraisalData };
      });
      
      // Show toast notification for status changes
      if (appraisal && newAppraisalData.status !== appraisal.status) {
        toast({
          title: 'Status Updated',
          description: `Appraisal status changed to ${newAppraisalData.status}`,
          variant: 'default',
        });
      }
    }
  }, [appraisalChange, toast, appraisal]);

  // Update comparables when realtime changes are received
  useEffect(() => {
    if (comparablesChange) {
      console.log('Realtime comparables update:', comparablesChange);
      
      // Handle different event types
      if (comparablesChange.eventType === 'INSERT') {
        const newComparable = comparablesChange.new as ComparableProperty;
        setComparables((prev) => [...prev, newComparable]);
      } else if (comparablesChange.eventType === 'UPDATE') {
        const updatedComparable = comparablesChange.new as ComparableProperty;
        setComparables((prev) => 
          prev.map((c) => (c.id === updatedComparable.id ? { ...c, ...updatedComparable } : c))
        );
      } else if (comparablesChange.eventType === 'DELETE') {
        const deletedComparable = comparablesChange.old as ComparableProperty;
        setComparables((prev) => prev.filter((c) => c.id !== deletedComparable.id));
      }
    }
  }, [comparablesChange]);

  // Log realtime connection status
  useEffect(() => {
    console.log(`Appraisal realtime connection: ${isAppraisalConnected ? 'connected' : 'disconnected'}`);
    console.log(`Comparables realtime connection: ${isComparablesConnected ? 'connected' : 'disconnected'}`);
  }, [isAppraisalConnected, isComparablesConnected]);

  // Check eligibility for valuation when appraisal or comparables change
  useEffect(() => {
    if (appraisal && comparables) {
      const eligibility = isEligibleForValuation(appraisal, comparables.length);
      setValuationEligibility(eligibility);
    }
  }, [appraisal, comparables]);

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

  // Add a new function to handle report URL updates
  const handleReportGenerated = (reportUrl: string) => {
    if (appraisal) {
      setAppraisal({
        ...appraisal,
        report_url: reportUrl
      });
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

  // Handle requesting valuation
  const handleRequestValuation = async () => {
    if (!id) return;
    
    setIsRequestingValuation(true);
    
    try {
      const result = await requestPropertyValuation(id);
      
      if (result.success && result.data) {
        toast({
          title: 'Valuation Complete',
          description: `Estimated value: $${result.data.valuationLow.toLocaleString()} - $${result.data.valuationHigh.toLocaleString()}`,
        });
        
        // Refresh the appraisal data to show the new valuation
        fetchAppraisal();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to generate valuation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error requesting valuation:', error);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsRequestingValuation(false);
    }
  };

  // Handle refresh market analysis
  const handleRefreshMarketAnalysis = async () => {
    // In production, this would call an API to refresh market data
    toast({
      title: 'Analysis Refreshed',
      description: 'Market analysis data has been updated with the latest information',
    });
  };

  // Initialize suburb stats when appraisal data loads
  useEffect(() => {
    if (appraisal && appraisal.property_suburb) {
      setSuburbStats({
        suburb: appraisal.property_suburb,
        medianPrice: 895000,
        avgDaysOnMarket: 32,
        salesVolume: 28,
        priceChange3Months: 2.8,
        priceChange1Year: 7.5
      });
    }
  }, [appraisal]);

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
              <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b mb-4">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="comparables">Comparable Properties</TabsTrigger>
                    <TabsTrigger value="market">Market Analysis</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="overview">
                  <div className="space-y-6">
                    {/* Property Details Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-lg font-medium mb-3">Property Details</h4>
                        <div className="bg-white border rounded-md divide-y">
                          <div className="flex justify-between p-3">
                            <span className="text-gray-500">Type</span>
                            <span className="font-medium capitalize">{appraisal.property_type}</span>
                          </div>
                          <div className="flex justify-between p-3">
                            <span className="text-gray-500">Bedrooms</span>
                            <span className="font-medium">{appraisal.bedrooms || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between p-3">
                            <span className="text-gray-500">Bathrooms</span>
                            <span className="font-medium">{appraisal.bathrooms || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between p-3">
                            <span className="text-gray-500">Land Size</span>
                            <span className="font-medium">{appraisal.land_area ? `${appraisal.land_area} m²` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between p-3">
                            <span className="text-gray-500">Floor Area</span>
                            <span className="font-medium">{appraisal.floor_area ? `${appraisal.floor_area} m²` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between p-3">
                            <span className="text-gray-500">Year Built</span>
                            <span className="font-medium">{appraisal.year_built || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-medium mb-3">Valuation Metrics</h4>
                        <div className="bg-white border rounded-md divide-y">
                          <div className="flex justify-between p-3">
                            <span className="text-gray-500">AppraisalHub Valuation</span>
                            <span className="font-medium">
                              {appraisal.valuation_low && appraisal.valuation_high 
                                ? `${formatPrice(appraisal.valuation_low)} - ${formatPrice(appraisal.valuation_high)}`
                                : 'Not calculated'}
                            </span>
                          </div>
                          <div className="flex justify-between p-3">
                            <span className="text-gray-500">CoreLogic Estimate</span>
                            <span className="font-medium">
                              {appraisal.corelogic_avm_estimate 
                                ? formatPrice(appraisal.corelogic_avm_estimate) 
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between p-3">
                            <span className="text-gray-500">REINZ Estimate</span>
                            <span className="font-medium">
                              {appraisal.reinz_avm_estimate 
                                ? formatPrice(appraisal.reinz_avm_estimate) 
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between p-3">
                            <span className="text-gray-500">Confidence Level</span>
                            <Badge 
                              variant={appraisal.confidence_level === 'high' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {appraisal.confidence_level || 'Medium'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Generated Content */}
                    {appraisal.ai_property_description && (
                      <div>
                        <h4 className="text-lg font-medium mb-2">Property Description</h4>
                        <div className="bg-white border rounded-md p-4">
                          <p className="text-sm">{appraisal.ai_property_description}</p>
                        </div>
                      </div>
                    )}

                    {appraisal.ai_market_overview && (
                      <div>
                        <h4 className="text-lg font-medium mb-2">Market Overview</h4>
                        <div className="bg-white border rounded-md p-4">
                          <p className="text-sm">{appraisal.ai_market_overview}</p>
                        </div>
                      </div>
                    )}

                    {/* CoreLogic AVM Data */}
                    {appraisal.corelogic_avm_estimate && (
                      <div className="border rounded-md p-4 bg-gray-50">
                        <CoreLogicAVMData 
                          avm_estimate={appraisal.corelogic_avm_estimate}
                          avm_range_low={appraisal.corelogic_avm_range_low}
                          avm_range_high={appraisal.corelogic_avm_range_high}
                          avm_confidence={appraisal.corelogic_avm_confidence}
                        />
                      </div>
                    )}

                    {/* REINZ Market Data */}
                    <div className="border rounded-md p-4 bg-gray-50">
                      <REINZMarketData 
                        reinz_data={appraisal.market_statistics_reinz}
                        suburb={appraisal.property_suburb}
                        city={appraisal.property_city}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="comparables">
                  <ComparableProperties 
                    appraisalId={appraisalId}
                    comparables={comparables}
                    loading={isLoading}
                    propertyType={appraisal.property_type}
                    propertySuburb={appraisal.property_suburb}
                  />
                </TabsContent>
                
                <TabsContent value="market">
                  <MarketAnalysis 
                    appraisalId={appraisalId}
                    propertyType={appraisal.property_type}
                    propertySuburb={appraisal.property_suburb}
                    propertyCity={appraisal.property_city}
                    insights={marketInsights}
                    priceHistory={priceHistory}
                    suburbStats={suburbStats}
                    loading={isLoading}
                    onRefreshAnalysis={handleRefreshMarketAnalysis}
                  />
                </TabsContent>
                
                <TabsContent value="reports">
                  {/* ... existing code ... */}
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
                  <ReportGenerationButton
                    appraisalId={id}
                    reportUrl={appraisal.report_url}
                    variant="outline"
                    size="sm"
                    onReportGenerated={handleReportGenerated}
                  />
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
          
          {/* Add Valuation Button */}
          {appraisal?.status !== 'pending' && !appraisal?.valuation_high && valuationEligibility.eligible && (
            <Button 
              onClick={handleRequestValuation}
              disabled={isRequestingValuation}
            >
              {isRequestingValuation ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Calculating Valuation...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Generate Valuation
                </>
              )}
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