import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserAppraisals, searchAppraisals } from '@/services/appraisal';
import { Database } from '@/types/supabase';
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
  Clock 
} from 'lucide-react';

type Appraisal = Database['public']['Tables']['appraisals']['Row'];

export function AppraisalList() {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [filteredAppraisals, setFilteredAppraisals] = useState<Appraisal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Filter appraisals when search query or status filter changes
  useEffect(() => {
    if (searchQuery.trim() === '' && statusFilter === 'all') {
      setFilteredAppraisals(appraisals);
      return;
    }
    
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
    
    setFilteredAppraisals(filtered);
  }, [searchQuery, statusFilter, appraisals]);

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
        
        <Button onClick={() => navigate('/dashboard/appraisals/new')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Appraisal
        </Button>
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
        
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
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
          
          {(searchQuery || statusFilter !== 'all') && (
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