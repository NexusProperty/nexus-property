import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserAppraisals, searchAppraisals } from '@/services/appraisal';
import { Database } from '@/types/supabase';
import { useUserAppraisalsRealtimeUpdates } from '@/hooks/useRealtimeSubscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  Search, 
  Home, 
  FileText, 
  X, 
  AlertCircle, 
  Clock,
  ArrowUpDown,
  WifiOff 
} from 'lucide-react';

type Appraisal = Database['public']['Tables']['appraisals']['Row'];
type SortOption = 'created_desc' | 'created_asc' | 'address_asc' | 'address_desc' | 'value_desc' | 'value_asc';

export function AppraisalList() {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [filteredAppraisals, setFilteredAppraisals] = useState<Appraisal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Set up realtime subscription for user's appraisals
  const userId = user?.id || '';
  const { isConnected: isRealtimeConnected, lastChange: appraisalChange } = 
    useUserAppraisalsRealtimeUpdates(userId);

  // Fetch appraisals on component mount
  useEffect(() => {
    if (!user) return;
    
    const fetchAppraisals = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getUserAppraisals(user.id);
        if (result.success && result.data) {
          setAppraisals(result.data);
          setFilteredAppraisals(result.data);
        } else {
          setError(result.error || 'Failed to fetch appraisals');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppraisals();
  }, [user]);

  // Handle realtime updates to appraisals
  useEffect(() => {
    if (!appraisalChange || !user) return;
    
    console.log('Appraisal realtime update received:', appraisalChange);
    
    // Type assertion to access properties
    const newRecord = appraisalChange.new as Appraisal | null;
    
    // Only process changes for this user's appraisals
    if (newRecord && newRecord.user_id === user.id) {
      if (appraisalChange.eventType === 'INSERT') {
        // Add new appraisal to the list
        setAppraisals(prev => [newRecord, ...prev]);
      } else if (appraisalChange.eventType === 'UPDATE') {
        // Update existing appraisal
        setAppraisals(prev => 
          prev.map(a => a.id === newRecord.id ? newRecord : a)
        );
      } else if (appraisalChange.eventType === 'DELETE') {
        // Remove deleted appraisal
        const deletedAppraisal = appraisalChange.old as Appraisal;
        setAppraisals(prev => 
          prev.filter(a => a.id !== deletedAppraisal.id)
        );
      }
    }
  }, [appraisalChange, user]);

  // Filter and sort appraisals when search query, status filter, or sort option changes
  useEffect(() => {
    if (!appraisals.length) return;
    
    // First apply filters
    let filtered = [...appraisals];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(appraisal => 
        appraisal.property_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appraisal.property_suburb.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appraisal.property_city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appraisal => appraisal.status === statusFilter);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      // Define variables for value comparisons outside of case blocks
      const aValueHigh = a.valuation_high || 0;
      const aValueLow = a.valuation_low || 0;
      const bValueHigh = b.valuation_high || 0;
      const bValueLow = b.valuation_low || 0;
      
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'address_asc':
          return a.property_address.localeCompare(b.property_address);
        case 'address_desc':
          return b.property_address.localeCompare(a.property_address);
        case 'value_desc':
          return (bValueHigh || bValueLow) - (aValueHigh || aValueLow);
        case 'value_asc':
          return (aValueHigh || aValueLow) - (bValueHigh || bValueLow);
        default:
          return 0;
      }
    });
    
    setFilteredAppraisals(sorted);
  }, [searchQuery, statusFilter, sortBy, appraisals]);

  // Handle search with API
  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await searchAppraisals(searchQuery, user.id);
      if (result.success && result.data) {
        setFilteredAppraisals(result.data);
      } else {
        setError(result.error || 'Search failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('created_desc');
    setFilteredAppraisals(appraisals);
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
        return <FileText className="h-4 w-4 mr-1" />;
      case 'pending':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'processing':
        return <Spinner className="h-4 w-4 mr-1" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 mr-1" />;
      default:
        return <FileText className="h-4 w-4 mr-1" />;
    }
  };

  // Format valuation range
  const formatValuationRange = (low: number | null, high: number | null) => {
    if (low === null && high === null) return 'Pending';
    if (low === null) return `Up to $${high?.toLocaleString()}`;
    if (high === null) return `From $${low?.toLocaleString()}`;
    return `$${low.toLocaleString()} - $${high.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Appraisals</h2>
        
        <div className="flex items-center gap-3">
          {isRealtimeConnected ? (
            <span className="text-xs text-green-600 flex items-center">
              <span className="relative mr-1.5">
                <span className="block h-2 w-2 rounded-full bg-green-600"></span>
                <span className="block absolute top-0 left-0 h-2 w-2 rounded-full bg-green-600 animate-ping opacity-75"></span>
              </span>
              Realtime
            </span>
          ) : (
            <span className="text-xs text-gray-500 flex items-center">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </span>
          )}
          
          <Button onClick={() => navigate('/dashboard/appraisals/new')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Appraisal
          </Button>
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search appraisals by address, suburb, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Newest first</SelectItem>
              <SelectItem value="created_asc">Oldest first</SelectItem>
              <SelectItem value="address_asc">Address (A-Z)</SelectItem>
              <SelectItem value="address_desc">Address (Z-A)</SelectItem>
              <SelectItem value="value_desc">Value (High-Low)</SelectItem>
              <SelectItem value="value_asc">Value (Low-High)</SelectItem>
            </SelectContent>
          </Select>
          
          {(searchQuery || statusFilter !== 'all' || sortBy !== 'created_desc') && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Empty state */}
          {filteredAppraisals.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FileText className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-1">No appraisals found</h3>
              <p className="text-sm text-gray-400 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try changing your search criteria'
                  : 'Create your first property appraisal to get started'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => navigate('/dashboard/appraisals/new')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Appraisal
                </Button>
              )}
            </div>
          )}
          
          {/* Appraisal list */}
          <div className="space-y-4">
            {filteredAppraisals.map((appraisal) => (
              <Card 
                key={appraisal.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/dashboard/appraisals/${appraisal.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{appraisal.property_address}</CardTitle>
                    <Badge className={getStatusBadgeColor(appraisal.status)}>
                      {getStatusIcon(appraisal.status)}
                      {appraisal.status}
                    </Badge>
                  </div>
                  <CardDescription>{appraisal.property_suburb}, {appraisal.property_city}</CardDescription>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Valuation Range</div>
                      <div className="font-medium">
                        {formatValuationRange(appraisal.valuation_low, appraisal.valuation_high)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Property Type</div>
                      <div className="font-medium capitalize">{appraisal.property_type}</div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="text-sm text-gray-500">
                  Created {new Date(appraisal.created_at).toLocaleDateString()}
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 