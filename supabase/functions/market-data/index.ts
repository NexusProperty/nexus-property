import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { withAuth, getAuthUser } from '../utils/auth-middleware.ts';
import { withCsrfProtection } from '../utils/csrf-middleware.ts';

// Import REINZ service and types
import { createReinzClient, LogLevel } from './reinz-service.ts';
import { 
  ReinzAuthConfig,
  MarketDataRequest,
  MarketDataResponse
} from './reinz-types.ts';

// Cache TTL in seconds
const CACHE_TTL = {
  SHORT: 60 * 5, // 5 minutes
  MEDIUM: 60 * 60 * 24, // 1 day
  LONG: 60 * 60 * 24 * 7, // 1 week
};

async function fetchMarketData(
  request: MarketDataRequest,
  supabase: SupabaseClient,
  useMock: boolean = false
): Promise<MarketDataResponse> {
  // Log the request details
  console.log(JSON.stringify({
    level: 'info',
    message: 'Fetching market data',
    request,
    useMock,
  }));
  
  try {
    // Create REINZ client
    const reinzConfig: ReinzAuthConfig = {
      apiKey: Deno.env.get('REINZ_API_KEY') || '',
      baseUrl: Deno.env.get('REINZ_API_URL') || 'https://api.reinz.co.nz'
    };

    // Check feature flag before proceeding
    const { data: featureFlag } = await supabase
      .from('feature_flags')
      .select('enabled, percentage')
      .eq('id', 'enable_reinz_market_data')
      .single();

    // Default to mock mode if feature flag is not enabled
    const useRealData = featureFlag?.enabled || false;
    const rolloutPercentage = featureFlag?.percentage || 0;
    
    // Calculate if this request should use real data based on percentage rollout
    // Use a hash of suburb+city to ensure consistent behavior
    const useRealForThisRequest = useRealData && 
      (rolloutPercentage >= 100 || 
      (Math.abs(hashString(`${request.suburb}${request.city}`)) % 100) < rolloutPercentage);
    
    // Final determination if we should use mock
    const useMockMode = useMock || !useRealForThisRequest;
    const reinz = createReinzClient(reinzConfig, useMockMode, LogLevel.INFO);

    // Generate a cache key from the request
    const cacheKey = generateCacheKey(request);

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('market_data_cache')
      .select('data, created_at')
      .eq('cache_key', cacheKey)
      .single();

    if (!cacheError && cachedData) {
      const cacheAge = Date.now() - new Date(cachedData.created_at).getTime();
      const cacheAgeInSeconds = Math.floor(cacheAge / 1000);

      // Check if cache is still valid (less than 1 day old)
      if (cacheAgeInSeconds < CACHE_TTL.MEDIUM) {
        console.log(JSON.stringify({
          level: 'info',
          message: 'Returning cached market data',
          cacheKey,
          cacheAgeInSeconds
        }));

        return cachedData.data;
      }
    }

    // Validate request
    if (!request.suburb || !request.city) {
      return {
        success: false,
        error: 'Missing required parameters: suburb and city are required'
      };
    }

    try {
      // Get historical data
      const historicalData = await reinz.getHistoricalMarketData({
        suburb: request.suburb,
        city: request.city,
        propertyType: request.propertyType,
        bedrooms: request.bedrooms,
        period: request.period || 12 // Default to 12 months
      });
      
      // Get current market snapshot
      const marketSnapshot = await reinz.getCurrentMarketSnapshot({
        suburb: request.suburb,
        city: request.city,
        propertyType: request.propertyType,
        bedrooms: request.bedrooms
      });
      
      // Get suburb comparison data
      const suburbComparison = await reinz.getSuburbComparison({
        suburb: request.suburb,
        city: request.city,
        propertyType: request.propertyType,
        numberOfSuburbs: 5 // Compare with 5 surrounding suburbs
      });
      
      // Generate trend analysis
      const trendAnalysis = await reinz.getTrendAnalysis({
        suburb: request.suburb,
        city: request.city,
        propertyType: request.propertyType,
        historicalData
      });

      const marketData: MarketDataResponse = {
        success: true,
        data: {
          historical: historicalData,
          currentSnapshot: marketSnapshot,
          suburbComparison,
          trendAnalysis,
          datasource: {
            dataProvider: 'REINZ',
            lastUpdated: new Date().toISOString().slice(0, 10),
            reportPeriod: marketSnapshot.asOf
          }
        }
      };

      // If successful, cache the response
      if (marketData.success) {
        try {
          const { error: insertError } = await supabase
            .from('market_data_cache')
            .upsert({
              cache_key: cacheKey,
              data: marketData,
              created_at: new Date().toISOString()
            });

          if (insertError) {
            console.error(JSON.stringify({
              level: 'error',
              message: 'Failed to cache market data',
              cacheKey,
              error: insertError.message
            }));
          }
        } catch (cacheError) {
          console.error(JSON.stringify({
            level: 'error',
            message: 'Cache operation failed',
            cacheKey,
            error: cacheError instanceof Error ? cacheError.message : String(cacheError)
          }));
        }
      }

      return marketData;
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Error fetching market data',
        request,
        error: error instanceof Error ? error.message : String(error)
      }));

      return {
        success: false,
        error: `Error fetching market data: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Unhandled exception in market data fetch',
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

// Generate a cache key from the market data request
function generateCacheKey(request: MarketDataRequest): string {
  const { suburb, city, propertyType, bedrooms, period } = request;
  return `${suburb}-${city}-${propertyType || 'all'}-${bedrooms || 'all'}-${period || 12}`;
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
        
        // Determine if we should use mock data based on environment variable
        const useMockOverride = (Deno.env.get('REINZ_USE_MOCK') || 'false') === 'true';
        
        // Fetch market data
        const marketDataRequest: MarketDataRequest = {
          suburb: requestData.suburb,
          city: requestData.city,
          propertyType: requestData.propertyType,
          bedrooms: requestData.bedrooms,
          period: requestData.period
        };
        
        const marketData = await fetchMarketData(marketDataRequest, supabase, useMockOverride);
        
        // Return response
        return new Response(
          JSON.stringify(marketData),
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