import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createProperty, updateProperty, uploadPropertyImage } from '@/services/property';
import { Database } from '@/types/supabase';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

// Define form validation schema
const propertyFormSchema = z.object({
  address: z.string().min(3, 'Address must be at least 3 characters'),
  suburb: z.string().min(2, 'Suburb must be at least 2 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  postcode: z.string().optional(),
  property_type: z.enum(['house', 'apartment', 'townhouse', 'land', 'commercial', 'other']),
  bedrooms: z.number().optional().nullable(),
  bathrooms: z.number().optional().nullable(),
  land_size: z.number().optional().nullable(),
  floor_area: z.number().optional().nullable(),
  year_built: z.number().optional().nullable(),
  features: z.array(z.string()).optional().nullable(),
  is_public: z.boolean().default(false),
  status: z.enum(['active', 'archived', 'draft']).default('active'),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyFormProps {
  initialData?: Property;
  isEdit?: boolean;
}

export function PropertyForm({ initialData, isEdit = false }: PropertyFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>(
    initialData?.images || []
  );

  // Initialize form with default values or edit data
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          // Convert some fields from their database types if needed
          bedrooms: initialData.bedrooms || undefined,
          bathrooms: initialData.bathrooms || undefined,
          land_size: initialData.land_size || undefined,
          floor_area: initialData.floor_area || undefined,
          year_built: initialData.year_built || undefined,
        }
      : {
          address: '',
          suburb: '',
          city: '',
          postcode: '',
          property_type: 'house',
          is_public: false,
          status: 'active',
        },
  });

  // Handle image upload
  const handleImageUpload = (files: File[]) => {
    setImages((prev) => [...prev, ...files]);
  };

  // Remove image from state
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove uploaded image
  const handleRemoveUploadedImage = (index: number) => {
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = async (data: PropertyFormValues) => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to perform this action',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let propertyId: string;
      
      if (isEdit && initialData) {
        // Update existing property
        const result = await updateProperty(initialData.id, {
          ...data,
          images: uploadedImageUrls,
        });
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to update property');
        }
        
        propertyId = result.data.id;
        
        toast({
          title: 'Property Updated',
          description: 'Your property has been updated successfully',
        });
      } else {
        // Create new property
        const result = await createProperty({
          ...data,
          owner_id: user.id,
          images: [],
          // Ensure required fields are provided
          address: data.address,
          suburb: data.suburb,
          city: data.city,
          property_type: data.property_type,
          metadata: {}
        });
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to create property');
        }
        
        propertyId = result.data.id;
        
        toast({
          title: 'Property Created',
          description: 'Your property has been created successfully',
        });
      }

      // Upload images if any
      if (images.length > 0) {
        const newImageUrls: string[] = [...uploadedImageUrls];
        
        for (const image of images) {
          const result = await uploadPropertyImage(propertyId, image);
          
          if (result.success && result.data) {
            newImageUrls.push(result.data.path);
          }
        }
        
        // Update property with new image URLs
        if (newImageUrls.length > 0) {
          await updateProperty(propertyId, { images: newImageUrls });
        }
      }

      // Redirect to property detail page
      navigate(`/dashboard/properties/${propertyId}`);
    } catch (error) {
      console.error('Error submitting property:', error);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Property' : 'Add New Property'}</CardTitle>
        <CardDescription>
          {isEdit
            ? 'Update your property details below'
            : 'Enter your property details to create a new listing'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Property Address */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Suburb */}
              <FormField
                control={form.control}
                name="suburb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suburb</FormLabel>
                    <FormControl>
                      <Input placeholder="Suburb" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Postcode */}
              <FormField
                control={form.control}
                name="postcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl>
                      <Input placeholder="Postcode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Property Type */}
              <FormField
                control={form.control}
                name="property_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bedrooms */}
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Number of bedrooms"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        value={field.value === null ? '' : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bathrooms */}
              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="Number of bathrooms"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        value={field.value === null ? '' : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Land Size */}
              <FormField
                control={form.control}
                name="land_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Land Size (m²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Land size in square meters"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        value={field.value === null ? '' : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Floor Area */}
              <FormField
                control={form.control}
                name="floor_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor Area (m²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Floor area in square meters"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        value={field.value === null ? '' : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Year Built */}
              <FormField
                control={form.control}
                name="year_built"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Built</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Year of construction"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        value={field.value === null ? '' : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Public Visibility */}
              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Public Listing</FormLabel>
                      <FormDescription>
                        Make this property visible to all users
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Property Images</h3>
                {/* This would be a component for uploading images, either custom or from a UI library */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Existing image preview */}
                  {uploadedImageUrls.length > 0 && (
                    <div>
                      <h4 className="text-sm text-gray-500 mb-2">Uploaded Images</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {uploadedImageUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Property ${index + 1}`}
                              className="h-24 w-32 object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={() => handleRemoveUploadedImage(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New image preview */}
                  {images.length > 0 && (
                    <div>
                      <h4 className="text-sm text-gray-500 mb-2">New Images</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {images.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New ${index + 1}`}
                              className="h-24 w-32 object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={() => handleRemoveImage(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File input */}
                  <Input 
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleImageUpload(Array.from(e.target.files));
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Upload images of your property. You can select multiple files.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/properties')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{isEdit ? 'Update Property' : 'Create Property'}</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 