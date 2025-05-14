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
import { PlusCircle, Search, Home, Building, Warehouse, Landmark, X, Building2, Grid, List, Filter, ChevronDown, MapPin, Bed, Bath, Calendar, ArrowUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';

// Extended Property type to include estimated_value
type Property = Database['public']['Tables']['properties']['Row'] & {
  estimated_value?: number;
};

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'price_high' | 'price_low' | 'alphabetical';

export function PropertyList() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000000]);
  const [bedroomsFilter, setBedroomsFilter] = useState<string>('any');
  const [bathroomsFilter, setBathroomsFilter] = useState<string>('any');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
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

  // Apply all filters and sorting to properties
  useEffect(() => {
    if (properties.length === 0) {
      setFilteredProperties([]);
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

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.status === statusFilter);
    }
    
    // Apply bedrooms filter
    if (bedroomsFilter !== 'any') {
      const bedroomsCount = parseInt(bedroomsFilter);
      if (bedroomsFilter === '4+') {
        filtered = filtered.filter(property => (property.bedrooms || 0) >= 4);
      } else {
        filtered = filtered.filter(property => property.bedrooms === bedroomsCount);
      }
    }
    
    // Apply bathrooms filter
    if (bathroomsFilter !== 'any') {
      const bathroomsCount = parseInt(bathroomsFilter);
      if (bathroomsFilter === '3+') {
        filtered = filtered.filter(property => (property.bathrooms || 0) >= 3);
      } else {
        filtered = filtered.filter(property => property.bathrooms === bathroomsCount);
      }
    }
    
    // Apply price range filter (assuming property has a price field)
    filtered = filtered.filter(property => {
      const price = property.estimated_value || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    // Apply sorting
    filtered = sortProperties(filtered, sortOption);
    
    setFilteredProperties(filtered);
  }, [searchQuery, propertyTypeFilter, statusFilter, bedroomsFilter, bathroomsFilter, priceRange, sortOption, properties]);

  // Sort properties based on selected option
  const sortProperties = (props: Property[], option: SortOption): Property[] => {
    const sorted = [...props];
    
    switch (option) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'price_high':
        return sorted.sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0));
      case 'price_low':
        return sorted.sort((a, b) => (a.estimated_value || 0) - (b.estimated_value || 0));
      case 'alphabetical':
        return sorted.sort((a, b) => a.address.localeCompare(b.address));
      default:
        return sorted;
    }
  };

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
    setBedroomsFilter('any');
    setBathroomsFilter('any');
    setStatusFilter('all');
    setPriceRange([0, 3000000]);
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

  // Format price for display
  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Render grid view item
  const renderGridItem = (property: Property) => (
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
        <div className="aspect-video flex items-center justify-center bg-gray-100 rounded-t-lg">
          <Home className="h-12 w-12 text-gray-400" />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg line-clamp-1">{property.address}</CardTitle>
            <CardDescription className="line-clamp-1">{property.suburb}, {property.city}</CardDescription>
          </div>
          <Badge className={getStatusBadgeColor(property.status)}>
            {property.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex justify-between text-sm">
          <div className="flex items-center">
            {getPropertyTypeIcon(property.property_type)}
            <span className="capitalize">{property.property_type}</span>
          </div>
          
          {property.estimated_value && (
            <div className="font-medium">
              {formatPrice(property.estimated_value)}
            </div>
          )}
        </div>
        
        <div className="flex mt-2 text-xs text-gray-500">
          {property.bedrooms && (
            <div className="flex items-center mr-3">
              <Bed className="h-3 w-3 mr-1" />
              {property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}
            </div>
          )}
          
          {property.bathrooms && (
            <div className="flex items-center">
              <Bath className="h-3 w-3 mr-1" />
              {property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 text-xs text-gray-500">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          Added {new Date(property.created_at).toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );

  // Render list view item
  const renderListItem = (property: Property) => (
    <Card 
      key={property.id} 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/dashboard/properties/${property.id}`)}
    >
      <div className="flex">
        {property.images && property.images.length > 0 ? (
          <div className="w-24 sm:w-40 h-full">
            <img 
              src={property.images[0]} 
              alt={property.address} 
              className="w-full h-full object-cover rounded-l-lg"
            />
          </div>
        ) : (
          <div className="w-24 sm:w-40 h-auto flex items-center justify-center bg-gray-100 rounded-l-lg">
            <Home className="h-8 w-8 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium line-clamp-1">{property.address}</h3>
              <p className="text-sm text-gray-500 line-clamp-1">{property.suburb}, {property.city}</p>
            </div>
            <Badge className={getStatusBadgeColor(property.status)}>
              {property.status}
            </Badge>
          </div>
          
          <div className="flex justify-between items-end mt-2">
            <div className="flex text-xs text-gray-500">
              <div className="flex items-center mr-3">
                {getPropertyTypeIcon(property.property_type)}
                <span className="capitalize">{property.property_type}</span>
              </div>
              
              {property.bedrooms && (
                <div className="flex items-center mr-3">
                  <Bed className="h-3 w-3 mr-1" />
                  {property.bedrooms}
                </div>
              )}
              
              {property.bathrooms && (
                <div className="flex items-center mr-3">
                  <Bath className="h-3 w-3 mr-1" />
                  {property.bathrooms}
                </div>
              )}
              
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(property.created_at).toLocaleDateString()}
              </div>
            </div>
            
            {property.estimated_value && (
              <div className="font-medium">
                {formatPrice(property.estimated_value)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Properties</h2>
        
        <Button onClick={() => navigate('/dashboard/properties/new')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>
      
      {/* Search and view controls */}
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
          {/* Property Type Filter */}
          <Select
            value={propertyTypeFilter}
            onValueChange={setPropertyTypeFilter}
          >
            <SelectTrigger className="w-[150px]">
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
          
          {/* Advanced Filters Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-1">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Filters</h4>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Status</h5>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Bedrooms</h5>
                  <Select
                    value={bedroomsFilter}
                    onValueChange={setBedroomsFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4+">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Bathrooms</h5>
                  <Select
                    value={bathroomsFilter}
                    onValueChange={setBathroomsFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bathrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3+">3+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <h5 className="text-sm font-medium">Price Range</h5>
                    <span className="text-xs text-gray-500">
                      {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    </span>
                  </div>
                  <Slider
                    defaultValue={priceRange}
                    min={0}
                    max={3000000}
                    step={50000}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="py-4"
                  />
                </div>
                
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Clear Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1">
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOption('newest')}>
                Date (Newest First)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption('oldest')}>
                Date (Oldest First)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption('price_high')}>
                Price (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption('price_low')}>
                Price (Low to High)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption('alphabetical')}>
                Address (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              className="rounded-r-none h-10 px-3"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              className="rounded-l-none h-10 px-3"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {(searchQuery || propertyTypeFilter !== 'all' || statusFilter !== 'all' || 
            bedroomsFilter !== 'any' || bathroomsFilter !== 'any' || 
            priceRange[0] > 0 || priceRange[1] < 3000000) && (
            <Button variant="ghost" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Applied Filters */}
      {(searchQuery || propertyTypeFilter !== 'all' || statusFilter !== 'all' || 
        bedroomsFilter !== 'any' || bathroomsFilter !== 'any' || 
        priceRange[0] > 0 || priceRange[1] < 3000000) && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="outline" className="gap-1">
              Search: {searchQuery}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
            </Badge>
          )}
          
          {propertyTypeFilter !== 'all' && (
            <Badge variant="outline" className="gap-1">
              Type: {propertyTypeFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setPropertyTypeFilter('all')} />
            </Badge>
          )}
          
          {statusFilter !== 'all' && (
            <Badge variant="outline" className="gap-1">
              Status: {statusFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
            </Badge>
          )}
          
          {bedroomsFilter !== 'any' && (
            <Badge variant="outline" className="gap-1">
              Bedrooms: {bedroomsFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setBedroomsFilter('any')} />
            </Badge>
          )}
          
          {bathroomsFilter !== 'any' && (
            <Badge variant="outline" className="gap-1">
              Bathrooms: {bathroomsFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setBathroomsFilter('any')} />
            </Badge>
          )}
          
          {(priceRange[0] > 0 || priceRange[1] < 3000000) && (
            <Badge variant="outline" className="gap-1">
              Price: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceRange([0, 3000000])} />
            </Badge>
          )}
        </div>
      )}
      
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
                {searchQuery || propertyTypeFilter !== 'all' || statusFilter !== 'all' || 
                  bedroomsFilter !== 'any' || bathroomsFilter !== 'any' || 
                  priceRange[0] > 0 || priceRange[1] < 3000000
                  ? 'Try changing your search criteria'
                  : 'Add your first property to get started'}
              </p>
              {!searchQuery && propertyTypeFilter === 'all' && statusFilter === 'all' && 
                bedroomsFilter === 'any' && bathroomsFilter === 'any' && 
                priceRange[0] === 0 && priceRange[1] === 3000000 && (
                <Button onClick={() => navigate('/dashboard/properties/new')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              )}
            </div>
          )}
          
          {/* Property view (grid or list) */}
          {filteredProperties.length > 0 && (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map(property => renderGridItem(property))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProperties.map(property => renderListItem(property))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
} 