import { supabase } from '../lib/supabase';
import { getAppraisalWithComparables, updateAppraisalStatus } from './appraisal';
import { Database } from '@/types/supabase';

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
    // Get the current user's auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Update appraisal status to 'awaiting_valuation'
    await updateAppraisalStatus(
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
    
    // Create valuation request
    const valuationRequest: ValuationRequest = {
      appraisalId,
      propertyDetails,
      comparableProperties,
    };
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('property-valuation', {
      body: valuationRequest,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    
    if (error) {
      // Update appraisal status to indicate error
      await updateAppraisalStatus(
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
      
      // Update the appraisal with the valuation results
      const { error: updateError } = await supabase
        .from('appraisals')
        .update({
          valuation_low: valuationLow,
          valuation_high: valuationHigh,
          valuation_confidence: valuationConfidence,
          updated_at: new Date().toISOString()
        })
        .eq('id', appraisalId);
        
      if (updateError) {
        console.error('Error updating appraisal with valuation results:', updateError);
      } else {
        // Update status to valuation_complete
        await updateAppraisalStatus(
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
export function isEligibleForValuation(
  propertyData: Appraisal, 
  comparablesCount: number
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // Check required property details
  if (!propertyData.property_address) {
    reasons.push('Property address is missing');
  }
  
  if (!propertyData.property_suburb) {
    reasons.push('Property suburb is missing');
  }
  
  if (!propertyData.property_city) {
    reasons.push('Property city is missing');
  }
  
  if (!propertyData.property_type) {
    reasons.push('Property type is missing');
  }
  
  // Check if there are enough comparable properties
  if (comparablesCount < 3) {
    reasons.push(`Not enough comparable properties (${comparablesCount}/3 minimum)`);
  }
  
  return { 
    eligible: reasons.length === 0,
    reasons
  };
} 