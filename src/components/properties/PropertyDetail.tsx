import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getProperty, deleteProperty } from '@/services/property';
import { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Home,
  Building2,
  Building,
  Landmark,
  Warehouse,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Maximize,
  Bed,
  Bath,
  Square,
  ChevronLeft,
  ImageIcon,
} from 'lucide-react';

type Property = Database['public']['Tables']['properties']['Row'];

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!id || !user) return;

    const fetchProperty = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getProperty(id);
        if (result.success && result.data) {
          // Check if user has permission to view this property
          if (result.data.owner_id !== user.id) {
            setError('You do not have permission to view this property');
            setProperty(null);
          } else {
            setProperty(result.data);
          }
        } else {
          setError(result.error || 'Failed to fetch property details');
          setProperty(null);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id, user]);

  // Property type icon mapping
  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'house':
        return <Home className="h-5 w-5 mr-2" />;
      case 'apartment':
        return <Building2 className="h-5 w-5 mr-2" />;
      case 'townhouse':
        return <Building className="h-5 w-5 mr-2" />;
      case 'land':
        return <Landmark className="h-5 w-5 mr-2" />;
      case 'commercial':
        return <Warehouse className="h-5 w-5 mr-2" />;
      default:
        return <Home className="h-5 w-5 mr-2" />;
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

  const handleDelete = async () => {
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
      console.error('Error deleting property:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/dashboard/properties')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Button>
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Property not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/dashboard/properties')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Button>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/dashboard/properties/edit/${property.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this property and all associated data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{property.address}</CardTitle>
              <CardDescription className="text-lg">
                {property.suburb}, {property.city}
                {property.postcode && `, ${property.postcode}`}
              </CardDescription>
            </div>
            <Badge className={getStatusBadgeColor(property.status)}>
              {property.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Image Gallery */}
          {property.images && property.images.length > 0 ? (
            <div className="space-y-4">
              <div className="aspect-video overflow-hidden rounded-lg">
                <img
                  src={property.images[activeImageIndex]}
                  alt={`Property view ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {property.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {property.images.map((image, index) => (
                    <div
                      key={index}
                      className={`cursor-pointer rounded-md overflow-hidden h-16 w-24 flex-shrink-0 border-2 ${
                        index === activeImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center">
              <ImageIcon className="h-16 w-16 text-gray-400 mb-2" />
              <p className="text-gray-500">No images available</p>
            </div>
          )}

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="appraisals">Appraisals</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center text-lg">
                    {getPropertyTypeIcon(property.property_type)}
                    <span className="capitalize">{property.property_type}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {property.bedrooms !== null && (
                      <div className="flex items-center">
                        <Bed className="h-5 w-5 mr-2 text-gray-500" />
                        <span>{property.bedrooms} Bedrooms</span>
                      </div>
                    )}

                    {property.bathrooms !== null && (
                      <div className="flex items-center">
                        <Bath className="h-5 w-5 mr-2 text-gray-500" />
                        <span>{property.bathrooms} Bathrooms</span>
                      </div>
                    )}

                    {property.land_size !== null && (
                      <div className="flex items-center">
                        <Maximize className="h-5 w-5 mr-2 text-gray-500" />
                        <span>{property.land_size} m² Land</span>
                      </div>
                    )}

                    {property.floor_area !== null && (
                      <div className="flex items-center">
                        <Square className="h-5 w-5 mr-2 text-gray-500" />
                        <span>{property.floor_area} m² Floor Area</span>
                      </div>
                    )}

                    {property.year_built !== null && (
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                        <span>Built in {property.year_built}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                    <span>Location Details</span>
                  </div>

                  <div className="space-y-2">
                    <p><strong>Address:</strong> {property.address}</p>
                    <p><strong>Suburb:</strong> {property.suburb}</p>
                    <p><strong>City:</strong> {property.city}</p>
                    {property.postcode && <p><strong>Postcode:</strong> {property.postcode}</p>}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4 mt-4">
              {property.features && property.features.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {property.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <div className="h-2 w-2 bg-primary rounded-full mr-2" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No features have been added for this property.</p>
              )}
            </TabsContent>

            <TabsContent value="appraisals" className="space-y-4 mt-4">
              <p className="text-gray-500">
                No appraisals have been created for this property yet.
              </p>
              <Button onClick={() => navigate(`/dashboard/appraisals/new?propertyId=${property.id}`)}>
                Create New Appraisal
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between text-sm text-gray-500 pt-2">
          <div>Added {new Date(property.created_at).toLocaleDateString()}</div>
          {property.updated_at !== property.created_at && (
            <div>Updated {new Date(property.updated_at).toLocaleDateString()}</div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 