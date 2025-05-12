import { supabase } from '../lib/supabase';

interface PropertyDataRequest {
  address: string;
  suburb: string;
  city: string;
  propertyType: string;
}

interface PropertyDetails {
  address: string;
  suburb: string;
  city: string;
  postcode?: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  landSize?: number;
  floorArea?: number;
  yearBuilt?: number;
  features?: string[];
}

interface ComparableProperty {
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
  imageUrl?: string;
}

interface MarketTrends {
  medianPrice: number;
  annualGrowth: number;
  salesVolume: number;
  daysOnMarket: number;
}

interface PropertyDataResponse {
  success: boolean;
  error?: string;
  data?: {
    propertyDetails: PropertyDetails;
    comparableProperties: ComparableProperty[];
    marketTrends: MarketTrends;
  };
}

/**
 * Fetches property data from the Supabase Edge Function
 * This includes property details, comparable properties, and market trends
 */
export async function fetchPropertyData(
  params: PropertyDataRequest
): Promise<PropertyDataResponse> {
  try {
    // Get the current user's auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Call the Supabase Edge Function with the user's auth token
    const { data, error } = await supabase.functions.invoke('property-data', {
      body: params,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw error;
    }

    return data as PropertyDataResponse;
  } catch (error) {
    console.error('Error fetching property data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

/**
 * Updates an appraisal with property data from the external API
 * This function fetches property data and then updates the appraisal
 */
export async function updateAppraisalWithPropertyData(
  appraisalId: string,
  propertyData: PropertyDataRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the current user's auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Call the Supabase Edge Function to fetch property data
    const response = await fetchPropertyData(propertyData);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch property data');
    }

    // Extract property details and comparable properties
    const { propertyDetails, comparableProperties, marketTrends } = response.data;

    // Update the appraisal with property details
    const { error: appraisalError } = await supabase
      .from('appraisals')
      .update({
        bedrooms: propertyDetails.bedrooms,
        bathrooms: propertyDetails.bathrooms,
        land_size: propertyDetails.landSize,
        floor_area: propertyDetails.floorArea,
        year_built: propertyDetails.yearBuilt,
        metadata: {
          ...propertyDetails,
          market_trends: marketTrends,
        },
        status: 'processing', // Update status to indicate processing
      })
      .eq('id', appraisalId);

    if (appraisalError) {
      throw appraisalError;
    }

    // Insert comparable properties
    const comparableInserts = comparableProperties.map(comp => ({
      appraisal_id: appraisalId,
      address: comp.address,
      suburb: comp.suburb,
      city: comp.city,
      property_type: comp.propertyType,
      bedrooms: comp.bedrooms,
      bathrooms: comp.bathrooms,
      land_size: comp.landSize,
      floor_area: comp.floorArea,
      year_built: comp.yearBuilt,
      sale_date: comp.saleDate ? new Date(comp.saleDate) : null,
      sale_price: comp.salePrice,
      similarity_score: comp.similarityScore,
      image_url: comp.imageUrl,
    }));

    const { error: comparablesError } = await supabase
      .from('comparable_properties')
      .insert(comparableInserts);

    if (comparablesError) {
      throw comparablesError;
    }

    // Success
    return { success: true };
  } catch (error) {
    console.error('Error updating appraisal with property data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
} 