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
import { Steps, Step } from '@/components/ui/steps';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

// Define validation schemas for each step
const locationSchema = z.object({
  address: z.string().min(3, 'Address must be at least 3 characters'),
  suburb: z.string().min(2, 'Suburb must be at least 2 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  postcode: z.string().optional().refine(data => !data || /^\d{4,}$/.test(data), {
    message: 'Postcode must be at least 4 digits'
  }),
});

const detailsSchema = z.object({
  property_type: z.enum(['house', 'apartment', 'townhouse', 'land', 'commercial', 'other'], {
    required_error: 'Please select a property type',
  }),
  bedrooms: z.coerce.number().positive('Bedrooms must be a positive number').optional().nullable(),
  bathrooms: z.coerce.number().positive('Bathrooms must be a positive number').optional().nullable(),
  land_size: z.coerce.number().positive('Land size must be a positive number').optional().nullable(),
  floor_area: z.coerce.number().positive('Floor area must be a positive number').optional().nullable(),
  year_built: z.coerce.number().min(1800, 'Year must be after 1800')
    .max(new Date().getFullYear() + 5, `Year cannot be more than ${new Date().getFullYear() + 5}`)
    .optional()
    .nullable(),
});

const additionalSchema = z.object({
  features: z.array(z.string()).optional().nullable(),
  status: z.enum(['active', 'archived', 'draft']).default('active'),
  is_public: z.boolean().default(false),
  notes: z.string().optional(),
});

// Define complete form validation schema by merging all step schemas
const propertyFormSchema = locationSchema.merge(detailsSchema).merge(additionalSchema);

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

// Define step type
type Step = {
  id: string;
  title: string;
  description: string;
  fields: (keyof PropertyFormValues)[];
  schema: z.ZodObject<z.ZodRawShape>;
};

interface MultiStepPropertyFormProps {
  initialData?: Property;
  isEdit?: boolean;
}

export function MultiStepPropertyForm({ initialData, isEdit = false }: MultiStepPropertyFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>(
    initialData?.images || []
  );

  // Define steps for the multi-step form
  const steps: Step[] = [
    {
      id: 'location',
      title: 'Location',
      description: 'Address & Location',
      fields: ['address', 'suburb', 'city', 'postcode'],
      schema: locationSchema,
    },
    {
      id: 'details',
      title: 'Property Details',
      description: 'Size & Features',
      fields: ['property_type', 'bedrooms', 'bathrooms', 'land_size', 'floor_area', 'year_built'],
      schema: detailsSchema,
    },
    {
      id: 'additional',
      title: 'Additional Information',
      description: 'Status & Visibility',
      fields: ['features', 'status', 'is_public', 'notes'],
      schema: additionalSchema,
    },
    {
      id: 'images',
      title: 'Images',
      description: 'Property Images',
      fields: [],
      schema: z.object({}),
    },
  ];

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
          notes: initialData.notes || '',
        }
      : {
          address: '',
          suburb: '',
          city: '',
          postcode: '',
          property_type: 'house',
          is_public: false,
          status: 'active',
          notes: '',
        },
    mode: 'onChange',
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

  // Helper functions for step navigation
  const nextStep = async () => {
    const currentSchema = steps[currentStep].schema;
    const currentFields = steps[currentStep].fields;
    
    // Get only the values for the current step's fields
    const currentValues = Object.fromEntries(
      Object.entries(form.getValues()).filter(([key]) => 
        currentFields.includes(key as keyof PropertyFormValues)
      )
    );

    // Validate current step's fields
    const result = currentSchema.safeParse(currentValues);
    
    if (!result.success) {
      // Focus on the first field with an error
      const fieldErrors = result.error.flatten().fieldErrors;
      const firstErrorField = Object.keys(fieldErrors)[0] as keyof PropertyFormValues;
      if (firstErrorField) {
        form.setFocus(firstErrorField);
      }
      
      // Trigger validation to show all errors
      await form.trigger(currentFields as Array<keyof PropertyFormValues>);
      return;
    }

    // If validation succeeds, move to next step
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
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

  // Determine which fields to display based on current step
  const currentFields = steps[currentStep].fields;

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
        {/* Steps progress indicator */}
        <Steps currentStep={currentStep} totalSteps={steps.length} className="mb-8">
          {steps.map((step, index) => (
            <Step 
              key={step.id}
              title={step.title} 
              description={step.description}
              step={index + 1}
              active={currentStep === index}
              completed={currentStep > index}
              className={index < currentStep ? "cursor-pointer" : ""}
              onClick={() => goToStep(index)}
            />
          ))}
        </Steps>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 0 && (
              /* Step 1: Location Information */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <FormDescription>
                          Enter the full street address of the property
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode</FormLabel>
                      <FormControl>
                        <Input placeholder="Postcode" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the postcode for the property location
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 1 && (
              /* Step 2: Property Details */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <FormDescription>
                        Select the type of property you are listing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <FormDescription>
                        Enter the number of bedrooms or leave blank if not applicable
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <FormDescription>
                        Enter the number of bathrooms or leave blank if not applicable
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <FormDescription>
                        Enter the total land area in square meters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <FormDescription>
                        Enter the interior floor area in square meters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <FormDescription>
                        Enter the year the property was built
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 2 && (
              /* Step 3: Additional Information */
              <div className="grid grid-cols-1 gap-6">
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
                      <FormDescription>
                        Set the current status of this property listing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes or special features about the property"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include any important details that don't fit in other fields
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          Make this property visible to all users. If unchecked, the property will only be visible to you and your team.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 3 && (
              /* Step 4: Images */
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Property Images</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload high-quality images of your property. Good photos can significantly increase interest in your listing.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* Existing image preview */}
                    {uploadedImageUrls.length > 0 && (
                      <div>
                        <h4 className="text-sm text-gray-500 mb-2">Uploaded Images</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {uploadedImageUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`Property ${index + 1}`}
                                className="h-32 w-full object-cover rounded-md"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {images.map((file, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`New ${index + 1}`}
                                className="h-32 w-full object-cover rounded-md"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <Input 
                        type="file"
                        accept="image/*"
                        multiple
                        id="image-upload"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleImageUpload(Array.from(e.target.files));
                          }
                        }}
                      />
                      <label 
                        htmlFor="image-upload" 
                        className="cursor-pointer flex flex-col items-center justify-center gap-1 text-muted-foreground"
                      >
                        <div className="p-2 bg-muted rounded-full mb-2">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="font-medium">Click to upload</span>
                        <span className="text-xs">
                          Upload JPG, PNG or WEBP (max. 10MB each)
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tip: Upload images of different angles of the property including interior, exterior, and any special features.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-4 border-t mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0 || isSubmitting}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  disabled={isSubmitting}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      {isEdit ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {isEdit ? 'Update Property' : 'Create Property'}
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Cancel Button */}
            <div className="flex justify-center pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/dashboard/properties')}
                disabled={isSubmitting}
              >
                Cancel and return to properties
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 