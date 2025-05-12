import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createAppraisal } from '@/services/appraisal';
import { getProperty } from '@/services/property';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

type Property = Database['public']['Tables']['properties']['Row'];
type AppraisalInsert = Database['public']['Tables']['appraisals']['Insert'];

// Define form validation schema
const appraisalFormSchema = z.object({
  property_id: z.string().optional().nullable(),
  property_address: z.string().min(3, 'Address must be at least 3 characters'),
  property_suburb: z.string().min(2, 'Suburb must be at least 2 characters'),
  property_city: z.string().min(2, 'City must be at least 2 characters'),
  property_type: z.enum(['house', 'apartment', 'townhouse', 'land', 'commercial', 'other']),
  bedrooms: z.number().optional().nullable(),
  bathrooms: z.number().optional().nullable(),
  land_size: z.number().optional().nullable(),
  is_public: z.boolean().default(false),
});

type AppraisalFormValues = z.infer<typeof appraisalFormSchema>;

export function AppraisalForm() {
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const [loadedProperty, setLoadedProperty] = useState<Property | null>(null);

  // Initialize form with default values
  const form = useForm<AppraisalFormValues>({
    resolver: zodResolver(appraisalFormSchema),
    defaultValues: {
      property_id: propertyId || null,
      property_address: '',
      property_suburb: '',
      property_city: '',
      property_type: 'house',
      bedrooms: null,
      bathrooms: null,
      land_size: null,
      is_public: false,
    },
  });

  // Load property data if propertyId is provided
  useEffect(() => {
    if (!propertyId) return;

    const loadProperty = async () => {
      setIsLoadingProperty(true);
      try {
        const result = await getProperty(propertyId);
        if (result.success && result.data) {
          setLoadedProperty(result.data);
          
          // Pre-fill form with property data
          form.setValue('property_address', result.data.address);
          form.setValue('property_suburb', result.data.suburb);
          form.setValue('property_city', result.data.city);
          form.setValue('property_type', result.data.property_type);
          form.setValue('bedrooms', result.data.bedrooms);
          form.setValue('bathrooms', result.data.bathrooms);
          form.setValue('land_size', result.data.land_size);
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to load property data',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error loading property:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingProperty(false);
      }
    };

    loadProperty();
  }, [propertyId, form, toast]);

  // Handle form submission
  const onSubmit = async (data: AppraisalFormValues) => {
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
      // Create appraisal
      const appraisalData: AppraisalInsert = {
        user_id: user.id,
        property_id: data.property_id || null,
        property_address: data.property_address,
        property_suburb: data.property_suburb,
        property_city: data.property_city,
        property_type: data.property_type,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        land_size: data.land_size,
        status: 'pending',
        is_public: data.is_public,
        metadata: {}
      };

      const result = await createAppraisal(appraisalData);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create appraisal');
      }
      
      toast({
        title: 'Appraisal Created',
        description: 'Your property appraisal has been started successfully',
      });
      
      // Redirect to appraisal details page
      navigate(`/dashboard/appraisals/${result.data.id}`);
    } catch (error) {
      console.error('Error creating appraisal:', error);
      
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
        <CardTitle>New Property Appraisal</CardTitle>
        <CardDescription>
          Request an AI-powered property valuation and market analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoadingProperty ? (
          <div className="flex justify-center items-center p-6">
            <Spinner size="lg" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {loadedProperty && (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>Using Property Data</AlertTitle>
                  <AlertDescription>
                    This appraisal will be linked to your property at {loadedProperty.address}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property Address */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="property_address"
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
                  name="property_suburb"
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
                  name="property_city"
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
                        <FormLabel>Public Appraisal</FormLabel>
                        <FormDescription>
                          Make this appraisal visible to all users
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/appraisals')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Creating Appraisal...
                    </>
                  ) : (
                    'Create Appraisal'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
} 