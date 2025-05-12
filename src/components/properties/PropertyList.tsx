import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProperties, searchProperties } from '@/services/property';
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
import { PlusCircle, Search, Home, Building, Warehouse, Landmark, X, Building2 } from 'lucide-react';

type Property = Database['public']['Tables']['properties']['Row'];

export function PropertyList() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch properties on component mount
  useEffect(() => {
    if (!user) return;
    
    const fetchProperties = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getUserProperties(user.id);
        if (result.success && result.data) {
          setProperties(result.data);
          setFilteredProperties(result.data);
        } else {
          setError(result.error || 'Failed to fetch properties');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProperties();
  }, [user]);

  // Filter properties when search query or property type filter changes
  useEffect(() => {
    if (searchQuery.trim() === '' && propertyTypeFilter === 'all') {
      setFilteredProperties(properties);
      return;
    }
    
    let filtered = [...properties];
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(property => 
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.suburb.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply property type filter
    if (propertyTypeFilter !== 'all') {
      filtered = filtered.filter(property => property.property_type === propertyTypeFilter);
    }
    
    setFilteredProperties(filtered);
  }, [searchQuery, propertyTypeFilter, properties]);

  // Handle search with API
  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await searchProperties(searchQuery, user.id);
      if (result.success && result.data) {
        setFilteredProperties(result.data);
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
    setPropertyTypeFilter('all');
    setFilteredProperties(properties);
  };

  // Property type icon mapping
  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'house':
        return <Home className="h-4 w-4 mr-1" />;
      case 'apartment':
        return <Building2 className="h-4 w-4 mr-1" />;
      case 'townhouse':
        return <Building className="h-4 w-4 mr-1" />;
      case 'land':
        return <Landmark className="h-4 w-4 mr-1" />;
      case 'commercial':
        return <Warehouse className="h-4 w-4 mr-1" />;
      default:
        return <Home className="h-4 w-4 mr-1" />;
    }
  };

  // Status badge color mapping
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Properties</h2>
        
        <Button onClick={() => navigate('/dashboard/properties/new')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search properties by address, suburb, or city..."
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
            value={propertyTypeFilter}
            onValueChange={setPropertyTypeFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="townhouse">Townhouse</SelectItem>
              <SelectItem value="land">Land</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          {(searchQuery || propertyTypeFilter !== 'all') && (
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
          {filteredProperties.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Home className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-1">No properties found</h3>
              <p className="text-sm text-gray-400 mb-4">
                {searchQuery || propertyTypeFilter !== 'all'
                  ? 'Try changing your search criteria'
                  : 'Add your first property to get started'}
              </p>
              {!searchQuery && propertyTypeFilter === 'all' && (
                <Button onClick={() => navigate('/dashboard/properties/new')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              )}
            </div>
          )}
          
          {/* Property grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card 
                key={property.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/dashboard/properties/${property.id}`)}
              >
                {property.images && property.images.length > 0 ? (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={property.images[0]} 
                      alt={property.address} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                    <Home className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                <CardHeader className="py-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{property.address}</CardTitle>
                    <Badge className={getStatusBadgeColor(property.status)}>
                      {property.status}
                    </Badge>
                  </div>
                  <CardDescription>{property.suburb}, {property.city}</CardDescription>
                </CardHeader>
                
                <CardContent className="py-2">
                  <div className="flex items-center gap-x-4 text-sm">
                    <div className="flex items-center">
                      {getPropertyTypeIcon(property.property_type)}
                      <span className="capitalize">{property.property_type}</span>
                    </div>
                    
                    {property.bedrooms !== null && (
                      <div>{property.bedrooms} bed</div>
                    )}
                    
                    {property.bathrooms !== null && (
                      <div>{property.bathrooms} bath</div>
                    )}
                    
                    {property.land_size !== null && (
                      <div>{property.land_size}m²</div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="py-3 text-sm text-gray-500">
                  Added {new Date(property.created_at).toLocaleDateString()}
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 