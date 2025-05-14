import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from '@/types/supabase';
import { Home, MapPin, Calendar, Ruler, DollarSign, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';

// Extended type for comparable properties
type BaseComparableProperty = Database['public']['Tables']['comparable_properties']['Row'];

export interface ComparableProperty extends BaseComparableProperty {
  id: string;
  address: string;
  suburb: string;
  city: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  floor_area: number | null;
  land_size: number | null;
  year_built: number | null;
  sale_price: number | null;
  sale_date: string | null;
  image_url: string | null;
  distance_km?: number;
  similarity_score?: number;
  key_highlights?: string[];
}

interface ComparablePropertiesProps {
  appraisalId: string;
  comparables: ComparableProperty[];
  loading: boolean;
  propertyType: string;
  propertySuburb: string;
}

export function ComparableProperties({ 
  appraisalId, 
  comparables, 
  loading, 
  propertyType,
  propertySuburb
}: ComparablePropertiesProps) {
  const [sortOption, setSortOption] = useState<string>('similarity');
  const [view, setView] = useState<string>('cards');
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-NZ', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  };

  // Format currency
  const formatCurrency = (value: number | null): string => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format distance
  const formatDistance = (distance: number | undefined): string => {
    if (distance === undefined) return 'Unknown';
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  // Calculate similarity score visual 
  const getSimilarityBadge = (score: number | undefined) => {
    if (score === undefined) return null;
    
    let color;
    let label;
    
    if (score >= 0.9) {
      color = 'bg-green-500';
      label = 'Excellent Match';
    } else if (score >= 0.8) {
      color = 'bg-green-400';
      label = 'Very Good Match';
    } else if (score >= 0.7) {
      color = 'bg-green-300';
      label = 'Good Match';
    } else if (score >= 0.6) {
      color = 'bg-yellow-400';
      label = 'Fair Match';
    } else {
      color = 'bg-yellow-300';
      label = 'Minimal Match';
    }
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${color} rounded-full`} 
              style={{ width: `${score * 100}%` }}
            ></div>
          </div>
          <span className="ml-2 text-sm font-medium">{Math.round(score * 100)}%</span>
        </div>
        <Badge variant="outline" className="ml-1">{label}</Badge>
      </div>
    );
  };
  
  // Sort comparables based on selected option
  const sortedComparables = [...comparables].sort((a, b) => {
    switch (sortOption) {
      case 'similarity':
        return (b.similarity_score || 0) - (a.similarity_score || 0);
      case 'price-high':
        return (b.sale_price || 0) - (a.sale_price || 0);
      case 'price-low':
        return (a.sale_price || 0) - (b.sale_price || 0);
      case 'date-recent':
        return new Date(b.sale_date || '').getTime() - new Date(a.sale_date || '').getTime();
      case 'distance':
        return (a.distance_km || 0) - (b.distance_km || 0);
      default:
        return 0;
    }
  });

  // Toggle expanded property
  const toggleExpandProperty = (id: string) => {
    if (expandedProperty === id) {
      setExpandedProperty(null);
    } else {
      setExpandedProperty(id);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Comparable Properties</CardTitle>
            <CardDescription>
              Similar properties recently sold in {propertySuburb}
            </CardDescription>
          </div>

          <div className="flex space-x-2">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="similarity">Best Match</SelectItem>
                <SelectItem value="price-high">Price (High to Low)</SelectItem>
                <SelectItem value="price-low">Price (Low to High)</SelectItem>
                <SelectItem value="date-recent">Most Recent</SelectItem>
                <SelectItem value="distance">Nearest First</SelectItem>
              </SelectContent>
            </Select>

            <Tabs defaultValue="cards" value={view} onValueChange={setView}>
              <TabsList>
                <TabsTrigger value="cards">Cards</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : sortedComparables.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-gray-500">No comparable properties found.</p>
          </div>
        ) : (
          <>
            <TabsContent value="cards" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedComparables.map((property) => (
                  <Card key={property.id} className="overflow-hidden h-full">
                    <div 
                      className="h-40 bg-gray-200 bg-cover bg-center"
                      style={{ 
                        backgroundImage: property.image_url 
                          ? `url(${property.image_url})` 
                          : `url('/images/property-placeholder.jpg')`
                      }}
                    ></div>
                    <CardContent className="p-4">
                      <h3 className="font-bold truncate">{property.address}</h3>
                      
                      <div className="flex justify-between items-start mt-2">
                        <div className="text-2xl font-bold">{formatCurrency(property.sale_price)}</div>
                        <Badge variant="outline">{formatDate(property.sale_date)}</Badge>
                      </div>
                      
                      <div className="mt-3">
                        {getSimilarityBadge(property.similarity_score)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                          <span>{formatDistance(property.distance_km)}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Home className="w-4 h-4 mr-1 text-gray-500" />
                          <span>{property.bedrooms || '?'} bed, {property.bathrooms || '?'} bath</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Ruler className="w-4 h-4 mr-1 text-gray-500" />
                          <span>{property.floor_area ? `${property.floor_area}m²` : 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                          <span>{property.year_built || 'N/A'}</span>
                        </div>
                      </div>
                      
                      {property.key_highlights && property.key_highlights.length > 0 && (
                        <div className="mt-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-0 h-auto flex items-center text-sm"
                            onClick={() => toggleExpandProperty(property.id)}
                          >
                            {expandedProperty === property.id ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                Hide details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                Show key highlights
                              </>
                            )}
                          </Button>
                          
                          {expandedProperty === property.id && (
                            <div className="mt-2 text-sm border-t pt-2">
                              <ul className="list-disc pl-5 space-y-1">
                                {property.key_highlights.map((highlight, idx) => (
                                  <li key={idx}>{highlight}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="table">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Address</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Price</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Sale Date</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Details</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Similarity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedComparables.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{property.address}</td>
                        <td className="px-4 py-2 text-sm font-bold">{formatCurrency(property.sale_price)}</td>
                        <td className="px-4 py-2 text-sm">{formatDate(property.sale_date)}</td>
                        <td className="px-4 py-2 text-sm">
                          {property.bedrooms || '?'} bed, {property.bathrooms || '?'} bath
                          <br />
                          {property.floor_area ? `${property.floor_area}m²` : 'N/A'} • {formatDistance(property.distance_km)}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {getSimilarityBadge(property.similarity_score)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="map">
              <div className="h-[400px] bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Map view is coming soon</p>
              </div>
            </TabsContent>
          </>
        )}
      </CardContent>
    </Card>
  );
} 