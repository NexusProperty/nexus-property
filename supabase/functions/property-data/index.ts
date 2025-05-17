import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { withAuth, getAuthUser } from '../utils/auth-middleware.ts';
import { withCsrfProtection } from '../utils/csrf-middleware.ts';

// Import CoreLogic service and types
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

interface PropertyDataRequest {
  address: string;
  suburb: string;
  city: string;
  propertyType: string;
  propertyId?: string;
  postcode?: string;
}

async function fetchPropertyData(
  request: PropertyDataRequest,
  supabase: SupabaseClient,
  useMock: boolean = false
): Promise<PropertyDataResponse> {
  // Log the request details
  console.log(JSON.stringify({
    level: 'info',
    message: 'Fetching property data',
    request,
    useMock,
  }));
  
  try {
    // Create CoreLogic client
    const corelogicConfig: CoreLogicAuthConfig = {
      apiKey: Deno.env.get('CORELOGIC_API_KEY') || '',
      apiSecret: Deno.env.get('CORELOGIC_API_SECRET') || '',
      baseUrl: Deno.env.get('CORELOGIC_API_URL') || 'https://api-uat.corelogic.asia'
    };

    // Check feature flag before proceeding
    const { data: featureFlag } = await supabase
      .from('feature_flags')
      .select('enabled, percentage')
      .eq('id', 'enable_corelogic_property_data')
      .single();

    // Default to mock mode if feature flag is not enabled
    const useRealData = featureFlag?.enabled || false;
    const rolloutPercentage = featureFlag?.percentage || 0;
    
    // Calculate if this request should use real data based on percentage rollout
    // Use a hash of propertyId or address to ensure consistent behavior
    const useRealForThisRequest = useRealData && 
      (rolloutPercentage >= 100 || 
      (Math.abs(hashString(request.propertyId || request.address)) % 100) < rolloutPercentage);
    
    // Final determination if we should use mock
    const useMockMode = useMock || !useRealForThisRequest;
    const corelogic = createCoreLogicClient(corelogicConfig, useMockMode, LogLevel.INFO);

    // Check cache first if propertyId is provided
    if (request.propertyId) {
      const { data: cachedData, error: cacheError } = await supabase
        .from('property_data_cache')
        .select('data, created_at')
        .eq('property_id', request.propertyId)
        .single();

      if (!cacheError && cachedData) {
        const cacheAge = Date.now() - new Date(cachedData.created_at).getTime();
        const cacheAgeInSeconds = Math.floor(cacheAge / 1000);

        // Check if cache is still valid (less than 1 day old)
        if (cacheAgeInSeconds < CACHE_TTL.MEDIUM) {
          console.log(JSON.stringify({
            level: 'info',
            message: 'Returning cached property data',
            propertyId: request.propertyId,
            cacheAgeInSeconds
          }));

          return cachedData.data;
        }
      }
    }

    // If we don't have a propertyId, we need to match the address first
    let resolvedPropertyId = request.propertyId;
    let matchedAddress: CoreLogicMatchedAddress | null = null;

    if (!resolvedPropertyId) {
      // Prepare address match request
      const addressMatchRequest: CoreLogicAddressMatchRequest = {
        address: request.address,
        suburb: request.suburb,
        city: request.city,
        postcode: request.postcode
      };

      try {
        // Match address to get propertyId
        matchedAddress = await corelogic.matchAddress(addressMatchRequest);
        resolvedPropertyId = matchedAddress.propertyId;

        console.log(JSON.stringify({
          level: 'info',
          message: 'Address matched successfully',
          address: request.address,
          matchedAddress: matchedAddress.fullAddress,
          propertyId: resolvedPropertyId
        }));
      } catch (error) {
        console.error(JSON.stringify({
          level: 'error',
          message: 'Address matching failed',
          address: request.address,
          error: error instanceof Error ? error.message : String(error)
        }));

        return {
          success: false,
          error: 'Could not match address. Please check the address and try again.'
        };
      }
    }

    // If we don't have a propertyId by now, return an error
    if (!resolvedPropertyId) {
      return {
        success: false,
        error: 'Property ID or address is required'
      };
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
          suburb: request.suburb || '',
          city: request.city || ''
        })
      ]);

      // Create address details for the property data response
      const addressDetails = {
        address: request.address || (matchedAddress ? matchedAddress.address : `Property ${resolvedPropertyId}`),
        addressComponents: {
          suburb: request.suburb || (matchedAddress ? matchedAddress.addressComponents.suburb : ''),
          city: request.city || (matchedAddress ? matchedAddress.addressComponents.city : ''),
          postcode: request.postcode || (matchedAddress ? matchedAddress.addressComponents.postcode : '')
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

      return propertyData;
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Error fetching property data',
        propertyId: resolvedPropertyId,
        error: error instanceof Error ? error.message : String(error)
      }));

      return {
        success: false,
        error: `Error fetching property data: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Unhandled exception in property data fetch',
      error: error instanceof Error ? error.message : String(error)
    }));
    
    return {
      success: false,
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)),
    };
  }
}

// Helper function to create a hash from a string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Update serve function to use the middleware
serve(
  withCsrfProtection(
    withAuth(async (req: Request) => {
      // Log incoming request
      console.log(JSON.stringify({
        level: 'info',
        message: 'Received request',
        method: req.method,
        url: req.url,
      }));
      
      // CORS headers
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Content-Type': 'application/json',
      };
      
      try {
        // Only accept POST requests
        if (req.method !== 'POST') {
          throw new Error('Method not allowed. Use POST.');
        }
        
        // Get the authenticated user
        const authUser = getAuthUser(req);
        if (!authUser) {
          throw new Error('User authentication failed');
        }

        // Log authenticated user
        console.log(JSON.stringify({
          level: 'info',
          message: 'Authenticated user',
          userId: authUser.userId,
          userRole: authUser.userRole || 'no role',
        }));
        
        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Parse request body
        const requestData = await req.json();
        
        // Validate request data
        if (!requestData.address || !requestData.suburb || !requestData.city || !requestData.propertyType) {
          throw new Error('Missing required fields: address, suburb, city, or propertyType');
        }
        
        // Determine if we should use mock data based on environment variable
        const useMockOverride = (Deno.env.get('CORELOGIC_USE_MOCK') || 'false') === 'true';
        
        // Fetch property data
        const propertyDataRequest: PropertyDataRequest = {
          address: requestData.address,
          suburb: requestData.suburb,
          city: requestData.city,
          propertyType: requestData.propertyType,
          propertyId: requestData.propertyId,
          postcode: requestData.postcode
        };
        
        const propertyData = await fetchPropertyData(propertyDataRequest, supabase, useMockOverride);
        
        // Return response
        return new Response(
          JSON.stringify(propertyData),
          { headers }
        );
      } catch (error) {
        // Log error
        console.error(JSON.stringify({
          level: 'error',
          message: 'Error processing request',
          error: error instanceof Error ? error.message : String(error)
        }));
        
        // Return error response
        return new Response(
          JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          }),
          { 
            status: 400, 
            headers 
          }
        );
      }
    }, { requireAuth: true }),
    { enforceForMutations: true }
  )
); 