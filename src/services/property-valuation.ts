import { supabase } from '../lib/supabase';
import { getAppraisalWithComparables } from './appraisal';
import { Database } from '@/types/supabase';
import { PropertyValuationData } from '@/data/property-valuation-data';
import { comparablePropertySchema, propertyDetailsSchema, valuationRequestSchema, valuationResultsSchema } from '@/lib/zodSchemas';
import { createValidationErrorResponse } from '@/utils/validationErrors';

// Initialize the data layer
const valuationData = new PropertyValuationData();

// Database types
type Appraisal = Database['public']['Tables']['appraisals']['Row'];
type ComparablePropertyDB = Database['public']['Tables']['comparable_properties']['Row'];

interface PropertyDetails {
  address: string;
  suburb: string;
  city: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  landSize?: number;
  floorArea?: number;
  yearBuilt?: number;
}

interface ComparableProperty {
  id: string;
  address: string;
  suburb: string;
  city: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  landSize?: number;
  floorArea?: number;
  yearBuilt?: number;
  saleDate?: string;
  salePrice?: number;
  similarityScore: number;
  distanceKm?: number;
}

interface ValuationRequest {
  appraisalId: string;
  propertyDetails: PropertyDetails;
  comparableProperties: ComparableProperty[];
}

interface ValuationResponse {
  success: boolean;
  error?: string;
  data?: {
    valuationLow: number;
    valuationHigh: number;
    valuationConfidence: number;
    adjustedComparables: Array<{
      id: string;
      address: string;
      salePrice: number;
      adjustedPrice: number;
      adjustmentFactor: number;
      weight: number;
      isOutlier: boolean;
    }>;
    valuationFactors: {
      bedroomValue?: number;
      bathroomValue?: number;
      landSizeValue?: number;
      floorAreaValue?: number;
      locationFactor?: number;
      ageAdjustment?: number;
    };
    marketTrends: {
      medianPrice: number;
      pricePerSqm: number;
      annualGrowth: number;
    };
  };
}

/**
 * Initiates a property valuation using the Edge Function.
 * This function fetches the appraisal and comparable properties,
 * then sends them to the valuation algorithm.
 */
export async function requestPropertyValuation(appraisalId: string): Promise<ValuationResponse> {
  try {
    // Validate appraisalId
    try {
      const result = valuationRequestSchema.shape.appraisalId.safeParse(appraisalId);
      if (!result.success) {
        const errorResponse = createValidationErrorResponse(result.error, 'Invalid appraisal ID format');
        return {
          success: false,
          error: errorResponse.error,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid appraisal ID format',
      };
    }

    // Get the current user's auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Update appraisal status to 'awaiting_valuation'
    await valuationData.updateAppraisalStatus(
      appraisalId,
      'awaiting_valuation',
      { reason: 'Valuation algorithm processing started' }
    );

    // Fetch appraisal with comparable properties
    const appraisalData = await getAppraisalWithComparables(appraisalId);
    
    if (!appraisalData.success || !appraisalData.data) {
      throw new Error(appraisalData.error || 'Failed to fetch appraisal data');
    }
    
    const { appraisal, comparables } = appraisalData.data;
    
    // Map appraisal to property details
    const propertyDetails: PropertyDetails = {
      address: appraisal.property_address,
      suburb: appraisal.property_suburb,
      city: appraisal.property_city,
      propertyType: appraisal.property_type,
      bedrooms: appraisal.bedrooms ?? undefined,
      bathrooms: appraisal.bathrooms ?? undefined,
      landSize: appraisal.land_size ?? undefined,
      floorArea: appraisal.floor_area ?? undefined,
      yearBuilt: appraisal.year_built ?? undefined,
    };
    
    // Validate property details
    try {
      const result = propertyDetailsSchema.safeParse(propertyDetails);
      if (!result.success) {
        const errorResponse = createValidationErrorResponse(
          result.error, 
          'Property details validation failed'
        );
        
        await valuationData.updateAppraisalStatus(
          appraisalId,
          'error',
          { 
            reason: 'Property details validation failed',
            metadata: { 
              error: errorResponse.error,
              validationErrors: errorResponse.metadata?.validationErrors
            }
          }
        );
        
        return {
          success: false,
          error: errorResponse.error,
        };
      }
    } catch (error) {
      await valuationData.updateAppraisalStatus(
        appraisalId,
        'error',
        { 
          reason: 'Property details validation failed',
          metadata: { error: error instanceof Error ? error.message : 'Invalid property details' }
        }
      );
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid property details',
      };
    }
    
    // Map comparables to required format
    const comparableProperties: ComparableProperty[] = comparables.map(comp => {
      // Extract distance from metadata if available
      const metadata = comp.metadata as { distance_km?: number } | null;
      const distanceKm = metadata?.distance_km;
      
      return {
        id: comp.id,
        address: comp.address,
        suburb: comp.suburb,
        city: comp.city,
        propertyType: comp.property_type,
        bedrooms: comp.bedrooms ?? undefined,
        bathrooms: comp.bathrooms ?? undefined,
        landSize: comp.land_size ?? undefined,
        floorArea: comp.floor_area ?? undefined,
        yearBuilt: comp.year_built ?? undefined,
        saleDate: comp.sale_date ? new Date(comp.sale_date).toISOString() : undefined,
        salePrice: comp.sale_price ?? undefined,
        similarityScore: comp.similarity_score || 50, // Default to 50% if not provided
        distanceKm
      };
    });
    
    // Validate each comparable property
    try {
      const validationErrors = [];
      
      for (let i = 0; i < comparableProperties.length; i++) {
        const result = comparablePropertySchema.safeParse(comparableProperties[i]);
        if (!result.success) {
          validationErrors.push({
            index: i,
            property: comparableProperties[i],
            errors: result.error
          });
        }
      }
      
      // If we have validation errors, format and return them
      if (validationErrors.length > 0) {
        // Create a comprehensive error message
        const errorMessage = `${validationErrors.length} comparable properties failed validation`;
        
        await valuationData.updateAppraisalStatus(
          appraisalId,
          'error',
          { 
            reason: errorMessage,
            metadata: { 
              validationErrors: validationErrors.map(e => ({
                index: e.index,
                address: e.property.address,
                errors: e.errors.errors.map(err => err.message)
              }))
            }
          }
        );
        
        return {
          success: false,
          error: errorMessage,
        };
      }
      
      // Validate that we have at least 3 comparable properties
      if (comparableProperties.length < 3) {
        const errorMessage = `At least 3 comparable properties are required for valuation (found ${comparableProperties.length})`;
        
        await valuationData.updateAppraisalStatus(
          appraisalId,
          'error',
          { 
            reason: errorMessage
          }
        );
        
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      await valuationData.updateAppraisalStatus(
        appraisalId,
        'error',
        { 
          reason: 'Comparable properties validation failed',
          metadata: { error: error instanceof Error ? error.message : 'Invalid comparable properties' }
        }
      );
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid comparable properties',
      };
    }
    
    // Create and validate valuation request
    const valuationRequest: ValuationRequest = {
      appraisalId,
      propertyDetails,
      comparableProperties,
    };
    
    try {
      const result = valuationRequestSchema.safeParse(valuationRequest);
      if (!result.success) {
        const errorResponse = createValidationErrorResponse(
          result.error, 
          'Valuation request validation failed'
        );
        
        await valuationData.updateAppraisalStatus(
          appraisalId,
          'error',
          { 
            reason: 'Valuation request validation failed',
            metadata: { 
              error: errorResponse.error,
              validationErrors: errorResponse.metadata?.validationErrors
            }
          }
        );
        
        return {
          success: false,
          error: errorResponse.error,
        };
      }
    } catch (error) {
      await valuationData.updateAppraisalStatus(
        appraisalId,
        'error',
        { 
          reason: 'Valuation request validation failed',
          metadata: { error: error instanceof Error ? error.message : 'Invalid valuation request' }
        }
      );
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid valuation request',
      };
    }
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('property-valuation', {
      body: valuationRequest,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    
    if (error) {
      // Update appraisal status to indicate error
      await valuationData.updateAppraisalStatus(
        appraisalId,
        'error',
        { 
          reason: 'Valuation algorithm failed',
          metadata: { error: error.message }
        }
      );
      
      throw error;
    }
    
    // If successful, update the appraisal with the valuation results
    if (data.success && data.data) {
      const { 
        valuationLow, 
        valuationHigh, 
        valuationConfidence 
      } = data.data;
      
      // Validate valuation results
      try {
        const valuationResults = {
          valuationLow,
          valuationHigh,
          valuationConfidence
        };
        
        const result = valuationResultsSchema.safeParse(valuationResults);
        if (!result.success) {
          const errorResponse = createValidationErrorResponse(
            result.error, 
            'Valuation results validation failed'
          );
          
          await valuationData.updateAppraisalStatus(
            appraisalId,
            'error',
            { 
              reason: 'Valuation results validation failed',
              metadata: { 
                error: errorResponse.error,
                validationErrors: errorResponse.metadata?.validationErrors
              }
            }
          );
          
          return {
            success: false,
            error: errorResponse.error,
          };
        }
        
        // Additional business rule validation
        if (valuationLow > valuationHigh) {
          throw new Error('Valuation low cannot be greater than valuation high');
        }
      } catch (error) {
        await valuationData.updateAppraisalStatus(
          appraisalId,
          'error',
          { 
            reason: 'Valuation results validation failed',
            metadata: { error: error instanceof Error ? error.message : 'Invalid valuation results' }
          }
        );
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid valuation results',
        };
      }
      
      // Update the appraisal with the valuation results using the data layer
      const updateResult = await valuationData.updateValuationResults(
        appraisalId, 
        {
          valuationLow,
          valuationHigh,
          valuationConfidence
        }
      );
        
      if (!updateResult.success) {
        console.error('Error updating appraisal with valuation results:', updateResult.error);
      } else {
        // Update status to valuation_complete
        await valuationData.updateAppraisalStatus(
          appraisalId,
          'valuation_complete',
          { 
            reason: 'Valuation algorithm completed successfully',
            metadata: { 
              valuationLow,
              valuationHigh,
              valuationConfidence
            }
          }
        );
      }
    }
    
    return data as ValuationResponse;
  } catch (error) {
    console.error('Error requesting property valuation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Check if an appraisal is eligible for valuation 
 * (has property details and comparable properties)
 */
export async function isEligibleForValuation(
  appraisalId: string
): Promise<{ eligible: boolean; reasons: string[] }> {
  try {
    // Use the data layer to check eligibility
    const result = await valuationData.getValuationEligibility(appraisalId);
    return {
      eligible: result.eligible,
      reasons: result.reasons
    };
  } catch (error) {
    return {
      eligible: false,
      reasons: [error instanceof Error ? error.message : 'An unknown error occurred']
    };
  }
} 