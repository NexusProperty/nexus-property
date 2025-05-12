import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createAppraisal } from '@/services/appraisal';
import { Database } from '@/types/supabase';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Steps, Step } from '@/components/ui/steps';

// Import individual step components
import { PropertyDetailsStep } from './wizard-steps/PropertyDetailsStep';
import { PropertyFeaturesStep } from './wizard-steps/PropertyFeaturesStep';
import { AppraisalParametersStep } from './wizard-steps/AppraisalParametersStep';
import { ConfirmationStep } from './wizard-steps/ConfirmationStep';

type AppraisalInsert = Database['public']['Tables']['appraisals']['Insert'];

// Define the overall form schema
const appraisalFormSchema = z.object({
  // Step 1: Property Details
  property_id: z.string().optional().nullable(),
  property_address: z.string().min(3, 'Address must be at least 3 characters'),
  property_suburb: z.string().min(2, 'Suburb must be at least 2 characters'),
  property_city: z.string().min(2, 'City must be at least 2 characters'),
  property_postcode: z.string().optional().nullable(),
  property_type: z.enum(['house', 'apartment', 'townhouse', 'land', 'commercial', 'other']),
  
  // Step 2: Property Features
  bedrooms: z.number().min(0).optional().nullable(),
  bathrooms: z.number().min(0).optional().nullable(),
  land_size: z.number().min(0).optional().nullable(),
  floor_area: z.number().min(0).optional().nullable(),
  year_built: z.number().min(1800).max(new Date().getFullYear()).optional().nullable(),
  features: z.array(z.string()).optional().nullable(),
  
  // Step 3: Appraisal Parameters
  comparable_radius: z.number().min(1).max(20).default(5),
  include_recent_sales: z.boolean().default(true),
  recent_sales_months: z.number().min(1).max(36).default(12),
  market_analysis_depth: z.enum(['basic', 'standard', 'detailed']).default('standard'),
  is_public: z.boolean().default(false),
});

type AppraisalFormValues = z.infer<typeof appraisalFormSchema>;

export function AppraisalWizard() {
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<AppraisalFormValues>({
    resolver: zodResolver(appraisalFormSchema),
    defaultValues: {
      property_id: propertyId || null,
      property_address: '',
      property_suburb: '',
      property_city: '',
      property_postcode: '',
      property_type: 'house',
      bedrooms: null,
      bathrooms: null,
      land_size: null,
      floor_area: null,
      year_built: null,
      features: [],
      comparable_radius: 5,
      include_recent_sales: true,
      recent_sales_months: 12,
      market_analysis_depth: 'standard',
      is_public: false,
    },
  });

  // Define steps
  const steps = [
    { id: 'property-details', title: 'Property Details', description: 'Enter the property location and type' },
    { id: 'property-features', title: 'Property Features', description: 'Describe the property characteristics' },
    { id: 'appraisal-parameters', title: 'Appraisal Parameters', description: 'Configure the appraisal settings' },
    { id: 'confirmation', title: 'Confirmation', description: 'Review and submit your appraisal request' },
  ];

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
      // Prepare metadata
      const metadata = {
        comparable_radius: data.comparable_radius,
        include_recent_sales: data.include_recent_sales,
        recent_sales_months: data.recent_sales_months,
        market_analysis_depth: data.market_analysis_depth,
        features: data.features,
      };

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
        floor_area: data.floor_area,
        year_built: data.year_built,
        status: 'pending',
        is_public: data.is_public,
        metadata: metadata
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

  // Determine if we can go to the next step
  const canAdvance = () => {
    switch (currentStep) {
      case 0: // Property Details
        return form.getValues('property_address') && 
               form.getValues('property_suburb') && 
               form.getValues('property_city') &&
               form.getValues('property_type');
      case 1: // Property Features
        return true; // All fields are optional
      case 2: // Appraisal Parameters
        return true; // Parameters have defaults
      default:
        return false;
    }
  };

  // Handle going to the next step
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle going to the previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>New Property Appraisal</CardTitle>
        <CardDescription>
          Create an AI-powered property valuation and market analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-8">
          <Steps currentStep={currentStep} totalSteps={steps.length}>
            {steps.map((step, index) => (
              <Step 
                key={step.id} 
                step={index + 1} 
                title={step.title} 
                description={step.description}
                active={currentStep === index}
                completed={currentStep > index}
              />
            ))}
          </Steps>
        </div>

        <div className="mt-8">
          {currentStep === 0 && (
            <PropertyDetailsStep form={form} />
          )}
          
          {currentStep === 1 && (
            <PropertyFeaturesStep form={form} />
          )}
          
          {currentStep === 2 && (
            <AppraisalParametersStep form={form} />
          )}
          
          {currentStep === 3 && (
            <ConfirmationStep formValues={form.getValues()} />
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        <div>
          {currentStep < steps.length - 1 ? (
            <Button 
              onClick={handleNext} 
              disabled={!canAdvance()}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" size="sm" />
                  Creating Appraisal...
                </>
              ) : (
                'Create Appraisal'
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 