/**
 * Property Data Edge Function
 * 
 * This Edge Function retrieves property data from CoreLogic API and returns
 * it in a format that can be used by the Nexus Property frontend.
 */

// Deno and Supabase imports - these will only be used in the Deno runtime
// @ts-expect-error: Deno imports
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-expect-error: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

import { createCoreLogicClient, LogLevel } from './corelogic-service.ts';
import { 
  CoreLogicAuthConfig, 
  PropertyDataResponse,
  CoreLogicAddressMatchRequest,
  CoreLogicPropertyAttributes,
  CoreLogicMatchedAddress
} from './corelogic-types.ts';
import { createPropertyDataResponse } from './corelogic-transformers.ts';

// Cache TTL in seconds
const CACHE_TTL = {
  SHORT: 60 * 5, // 5 minutes
  MEDIUM: 60 * 60 * 24, // 1 day
  LONG: 60 * 60 * 24 * 7, // 1 week
};

// Define request types
interface PropertyDataRequest {
  address?: string;
  suburb?: string;
  city?: string;
  postcode?: string;
  propertyId?: string;
}

// Add Deno global type for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req: Request) => {
  try {
    // Get API key from environment variables
    const apiKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const apiUrl = Deno.env.get('SUPABASE_URL') || '';

    // Create Supabase client
    const supabase = createClient(apiUrl, apiKey);

    // Parse request body
    const { address, suburb, city, postcode, propertyId } = await req.json() as PropertyDataRequest;

    // Create CoreLogic client
    const corelogicConfig: CoreLogicAuthConfig = {
      apiKey: Deno.env.get('CORELOGIC_API_KEY') || '',
      apiSecret: Deno.env.get('CORELOGIC_API_SECRET') || '',
      baseUrl: Deno.env.get('CORELOGIC_API_URL') || 'https://api-uat.corelogic.asia'
    };

    // Check if we should use mock mode (for development without API access)
    const useMockMode = (Deno.env.get('CORELOGIC_USE_MOCK') || 'false') === 'true';
    const corelogic = createCoreLogicClient(corelogicConfig, useMockMode, LogLevel.INFO);

    // Log request details
    console.log(JSON.stringify({
      level: 'info',
      message: 'Property data request received',
      address,
      suburb,
      city,
      postcode,
      propertyId,
      useMockMode
    }));

    // Check cache first if propertyId is provided
    if (propertyId) {
      const { data: cachedData, error: cacheError } = await supabase
        .from('property_data_cache')
        .select('data, created_at')
        .eq('property_id', propertyId)
        .single();

      if (!cacheError && cachedData) {
        const cacheAge = Date.now() - new Date(cachedData.created_at).getTime();
        const cacheAgeInSeconds = Math.floor(cacheAge / 1000);

        // Check if cache is still valid (less than 1 day old)
        if (cacheAgeInSeconds < CACHE_TTL.MEDIUM) {
          console.log(JSON.stringify({
            level: 'info',
            message: 'Returning cached property data',
            propertyId,
            cacheAgeInSeconds
          }));

          return new Response(
            JSON.stringify(cachedData.data),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // If we don't have a propertyId, we need to match the address first
    let resolvedPropertyId = propertyId;
    let matchedAddress: CoreLogicMatchedAddress | null = null;

    if (!resolvedPropertyId && address) {
      // Prepare address match request
      const addressMatchRequest: CoreLogicAddressMatchRequest = {
        address,
        suburb,
        city,
        postcode
      };

      try {
        // Match address to get propertyId
        matchedAddress = await corelogic.matchAddress(addressMatchRequest);
        resolvedPropertyId = matchedAddress.propertyId;

        console.log(JSON.stringify({
          level: 'info',
          message: 'Address matched successfully',
          address,
          matchedAddress: matchedAddress.fullAddress,
          propertyId: resolvedPropertyId
        }));
      } catch (error) {
        console.error(JSON.stringify({
          level: 'error',
          message: 'Address matching failed',
          address,
          error: error instanceof Error ? error.message : String(error)
        }));

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Could not match address. Please check the address and try again.'
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // If we don't have a propertyId by now, return an error
    if (!resolvedPropertyId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Property ID or address is required'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch all required data in parallel
    try {
      // First get property attributes
      const propertyAttributes = await corelogic.getPropertyAttributes(resolvedPropertyId);
      
      // Then fetch the rest in parallel
      const [
        salesHistory,
        avm,
        marketStats
      ] = await Promise.all([
        corelogic.getPropertySalesHistory(resolvedPropertyId),
        corelogic.getPropertyAVM(resolvedPropertyId),
        corelogic.getMarketStatistics({
          suburb: suburb || '',
          city: city || ''
        })
      ]);

      // Create address details for the property data response
      const addressDetails = {
        address: address || (matchedAddress ? matchedAddress.address : `Property ${resolvedPropertyId}`),
        addressComponents: {
          suburb: suburb || (matchedAddress ? matchedAddress.addressComponents.suburb : ''),
          city: city || (matchedAddress ? matchedAddress.addressComponents.city : ''),
          postcode: postcode || (matchedAddress ? matchedAddress.addressComponents.postcode : '')
        }
      };

      const propertyData: PropertyDataResponse = createPropertyDataResponse(
        resolvedPropertyId,
        propertyAttributes,
        addressDetails,
        salesHistory,
        avm,
        marketStats
      );

      // If successful, cache the response
      if (propertyData.success && propertyData.data) {
        try {
          const { error: insertError } = await supabase
            .from('property_data_cache')
            .upsert({
              property_id: resolvedPropertyId,
              data: propertyData,
              created_at: new Date().toISOString()
            });

          if (insertError) {
            console.error(JSON.stringify({
              level: 'error',
              message: 'Failed to cache property data',
              propertyId: resolvedPropertyId,
              error: insertError.message
            }));
          }
        } catch (cacheError) {
          console.error(JSON.stringify({
            level: 'error',
            message: 'Cache operation failed',
            propertyId: resolvedPropertyId,
            error: cacheError instanceof Error ? cacheError.message : String(cacheError)
          }));
        }
      }

      // Return the response
      return new Response(
        JSON.stringify(propertyData),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Error fetching property data',
        propertyId: resolvedPropertyId,
        error: error instanceof Error ? error.message : String(error)
      }));

      return new Response(
        JSON.stringify({
          success: false,
          error: `Error fetching property data: ${error instanceof Error ? error.message : String(error)}`
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Unhandled exception in edge function',
      error: error instanceof Error ? error.message : String(error)
    }));

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}); 