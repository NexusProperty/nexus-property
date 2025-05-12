import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProperty, deleteProperty } from '@/services/property';
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
import { 
  Home, 
  Building, 
  Building2, 
  Warehouse, 
  Landmark, 
  Edit, 
  Trash, 
  ChevronLeft,
  ArrowLeft,
  MapPin,
  Calendar,
  Maximize,
  Globe
} from 'lucide-react';

type Property = Database['public']['Tables']['properties']['Row'];

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fetch property data
  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getProperty(id);
        if (result.success && result.data) {
          setProperty(result.data);
        } else {
          setError(result.error || 'Failed to load property');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

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

  // Handle property deletion
  const handleDeleteProperty = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    
    try {
      const result = await deleteProperty(id);
      
      if (result.success) {
        toast({
          title: 'Property Deleted',
          description: 'The property has been deleted successfully',
        });
        
        navigate('/dashboard/properties');
      } else {
        throw new Error(result.error || 'Failed to delete property');
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Property not found'}
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
            onClick={() => navigate('/dashboard/properties')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
          
          <h2 className="text-2xl font-bold">{property.address}</h2>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/properties/${id}/edit`)}
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
                <DialogTitle>Delete Property</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this property? This action cannot be undone.
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
                  onClick={handleDeleteProperty}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Property'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Property details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Property images */}
        <div className="md:col-span-2">
          <Card>
            {/* Image gallery */}
            <div className="relative">
              {property.images && property.images.length > 0 ? (
                <>
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={property.images[activeImageIndex]}
                      alt={property.address}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Thumbnail navigation */}
                  {property.images.length > 1 && (
                    <div className="flex overflow-x-auto p-2 space-x-2 mt-2">
                      {property.images.map((image, index) => (
                        <div
                          key={index}
                          className={`h-16 w-24 cursor-pointer ${
                            index === activeImageIndex ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setActiveImageIndex(index)}
                        >
                          <img
                            src={image}
                            alt={`Property thumbnail ${index + 1}`}
                            className="h-full w-full object-cover rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                  <Home className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
            
            <CardContent className="pt-6">
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Property Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{property.suburb}, {property.city}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="mr-2">
                          {getPropertyTypeIcon(property.property_type)}
                        </div>
                        <span className="capitalize">{property.property_type}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Listed on {new Date(property.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {property.bedrooms !== null && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{property.bedrooms}</span>
                          <span>Bedrooms</span>
                        </div>
                      )}
                      
                      {property.bathrooms !== null && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">{property.bathrooms}</span>
                          <span>Bathrooms</span>
                        </div>
                      )}
                      
                      {property.land_size !== null && (
                        <div className="flex items-center">
                          <Maximize className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{property.land_size}m² Land</span>
                        </div>
                      )}
                      
                      {property.floor_area !== null && (
                        <div className="flex items-center">
                          <Maximize className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{property.floor_area}m² Floor Area</span>
                        </div>
                      )}
                      
                      {property.year_built !== null && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span>Built in {property.year_built}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{property.is_public ? 'Public' : 'Private'} Listing</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Additional Information</h3>
                    <p className="text-gray-600">
                      {typeof property.metadata === 'object' && property.metadata && 'description' in property.metadata
                        ? String(property.metadata.description)
                        : 'No additional information available.'}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="features" className="space-y-4 mt-4">
                  {property.features && property.features.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {property.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-primary mr-2" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No features listed for this property.</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Property summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Property Summary</CardTitle>
              <CardDescription>{property.suburb}, {property.city}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm">Status</div>
                <Badge className={getStatusBadgeColor(property.status)}>
                  {property.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">Type</div>
                <div className="flex items-center">
                  {getPropertyTypeIcon(property.property_type)}
                  <span className="ml-1 capitalize">{property.property_type}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">Created</div>
                <div>{new Date(property.created_at).toLocaleDateString()}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">Last Updated</div>
                <div>{new Date(property.updated_at).toLocaleDateString()}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">Visibility</div>
                <div>{property.is_public ? 'Public' : 'Private'}</div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/dashboard/appraisals/new?propertyId=${property.id}`)}
                >
                  Create Appraisal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 