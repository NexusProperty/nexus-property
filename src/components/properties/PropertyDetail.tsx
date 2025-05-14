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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  ChevronRight,
  X,
  Expand,
  ArrowLeft,
  ArrowRight,
  Info,
  Tag,
  DollarSign,
  Home as HomeIcon,
  Ruler,
  Car,
  CheckSquare,
  User,
  Calendar as CalendarIcon,
  Map,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

type Property = Database['public']['Tables']['properties']['Row'] & {
  estimated_value?: number;
  description?: string;
};

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
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

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

  // Format currency
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Navigate through gallery
  const nextImage = () => {
    if (!property?.images) return;
    setActiveImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    if (!property?.images) return;
    setActiveImageIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
  };

  // Format amenities from features array
  const getAmenities = () => {
    if (!property?.features || property.features.length === 0) {
      return ['None listed'];
    }
    return property.features;
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

      {/* Property Header Card */}
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
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card>
            <CardContent className="p-0 overflow-hidden">
              {property.images && property.images.length > 0 ? (
                <div className="relative">
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={property.images[activeImageIndex]}
                      alt={`Property view ${activeImageIndex + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setIsGalleryOpen(true)}
                    />
                  </div>
                  
                  {/* Gallery Navigation Buttons */}
                  {property.images.length > 1 && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-2 bg-black/30 text-white hover:bg-black/50 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsGalleryOpen(true);
                        }}
                      >
                        <Expand className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                  
                  {/* Gallery Thumbnails */}
                  {property.images.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto">
                      {property.images.map((image, index) => (
                        <div 
                          key={index}
                          className={`
                            w-20 h-20 flex-shrink-0 cursor-pointer rounded
                            ${index === activeImageIndex ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'}
                          `}
                          onClick={() => setActiveImageIndex(index)}
                        >
                          <img 
                            src={image} 
                            alt={`Thumbnail ${index + 1}`} 
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">No images available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Details Tabs */}
          <Card>
            <Tabs defaultValue="details">
              <div className="px-6 pt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                  <TabsTrigger value="features" className="flex-1">Features & Amenities</TabsTrigger>
                  <TabsTrigger value="location" className="flex-1">Location</TabsTrigger>
                </TabsList>
              </div>
              
              {/* Details Tab */}
              <TabsContent value="details" className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Property Type</p>
                      <p className="font-medium flex items-center">
                        {getPropertyTypeIcon(property.property_type)}
                        <span className="capitalize">{property.property_type}</span>
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Estimated Value</p>
                      <p className="font-medium flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-emerald-600" />
                        {formatCurrency(property.estimated_value)}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                      <p className="font-medium flex items-center">
                        <Bed className="h-5 w-5 mr-2 text-blue-600" />
                        {property.bedrooms ?? 'N/A'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                      <p className="font-medium flex items-center">
                        <Bath className="h-5 w-5 mr-2 text-blue-600" />
                        {property.bathrooms ?? 'N/A'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Land Size</p>
                      <p className="font-medium flex items-center">
                        <Ruler className="h-5 w-5 mr-2 text-purple-600" />
                        {property.land_size ? `${property.land_size} m²` : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Floor Area</p>
                      <p className="font-medium flex items-center">
                        <Square className="h-5 w-5 mr-2 text-purple-600" />
                        {property.floor_area ? `${property.floor_area} m²` : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Year Built</p>
                      <p className="font-medium flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2 text-amber-600" />
                        {property.year_built ?? 'N/A'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Added</p>
                      <p className="font-medium flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                        {formatDate(property.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {property.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              {/* Features Tab */}
              <TabsContent value="features" className="p-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Features & Amenities</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getAmenities().map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <CheckSquare className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              {/* Location Tab */}
              <TabsContent value="location" className="p-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Location Information</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-red-600" />
                      <span>
                        {property.address}, {property.suburb}, {property.city}
                        {property.postcode && `, ${property.postcode}`}
                      </span>
                    </div>
                    
                    <div className="bg-gray-100 rounded-md h-60 flex items-center justify-center">
                      <div className="text-center">
                        <Map className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">Map view not available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
        
        {/* Right Column - Property Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge className={getStatusBadgeColor(property.status)}>
                  {property.status}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{property.property_type}</span>
              </div>
              
              {property.estimated_value && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Estimated Value</span>
                  <span className="font-medium">{formatCurrency(property.estimated_value)}</span>
                </div>
              )}
              
              {(property.bedrooms || property.bathrooms) && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Size</span>
                  <span>
                    {property.bedrooms && `${property.bedrooms} bed`}
                    {property.bedrooms && property.bathrooms && ' · '}
                    {property.bathrooms && `${property.bathrooms} bath`}
                  </span>
                </div>
              )}
              
              {(property.land_size || property.floor_area) && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Area</span>
                  <span>
                    {property.floor_area && `${property.floor_area} m² (floor)`}
                    {property.floor_area && property.land_size && ' · '}
                    {property.land_size && `${property.land_size} m² (land)`}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Added</span>
                <span>{formatDate(property.created_at)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Owner</span>
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  You
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button className="w-full" onClick={() => navigate(`/dashboard/appraisals/new?propertyId=${property.id}`)}>
                  Start New Appraisal
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/dashboard/reports/new?propertyId=${property.id}`)}>
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Full Screen Gallery Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 text-white border-none">
          <div className="relative h-[80vh] flex items-center justify-center p-4">
            {/* Close Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-2 z-10 bg-black/50 text-white hover:bg-black/80 rounded-full"
              onClick={() => setIsGalleryOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            {/* Navigation Buttons */}
            {property.images && property.images.length > 1 && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/80 rounded-full"
                  onClick={prevImage}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/80 rounded-full"
                  onClick={nextImage}
                >
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </>
            )}
            
            {/* Image */}
            {property.images && property.images.length > 0 && (
              <img
                src={property.images[activeImageIndex]}
                alt={`Property view ${activeImageIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            )}
            
            {/* Image Counter */}
            {property.images && property.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-sm">
                {activeImageIndex + 1} / {property.images.length}
              </div>
            )}
          </div>
          
          {/* Thumbnails */}
          {property.images && property.images.length > 1 && (
            <div className="bg-black/80 p-4">
              <ScrollArea className="h-24">
                <div className="flex gap-2">
                  {property.images.map((image, index) => (
                    <div
                      key={index}
                      className={`
                        w-20 h-20 flex-shrink-0 cursor-pointer rounded
                        ${index === activeImageIndex ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'}
                      `}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 