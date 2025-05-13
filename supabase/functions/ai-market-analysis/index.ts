import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

interface MarketAnalysisRequest {
  appraisalId: string;
  propertyType: string;
  suburb: string;
  city: string;
  recentSales?: Array<{
    price: number;
    date: string;
  }>;
  marketTrends?: {
    medianPrice: number;
    annualGrowth: number;
    salesVolume: number;
    daysOnMarket: number;
  };
}

interface MarketAnalysisResponse {
  success: boolean;
  error?: string;
  data?: {
    marketInsights: string;
    buyerDemandAnalysis: string;
    futureTrends: string;
    keySellingPoints: string[];
    recommendedMarketingStrategy: string;
  };
}

// Mock AI market analysis generation
// In a real implementation, this would call Google Vertex AI/Gemini API
async function generateMarketAnalysis(request: MarketAnalysisRequest): Promise<MarketAnalysisResponse> {
  // Log the request details
  console.log(JSON.stringify({
    level: 'info',
    message: 'Generating AI market analysis',
    request,
  }));
  
  try {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock response data
    // In a real implementation, this would come from the AI service
    const response: MarketAnalysisResponse = {
      success: true,
      data: {
        marketInsights: `The ${request.suburb} area in ${request.city} has shown strong performance for ${request.propertyType} properties over the past 12 months. With median prices at $${request.marketTrends?.medianPrice.toLocaleString() || '980,000'} and annual growth of ${request.marketTrends?.annualGrowth || 5.2}%, this market continues to outperform many neighboring suburbs. Properties are selling within ${request.marketTrends?.daysOnMarket || 28} days on average, indicating steady buyer demand.`,
        
        buyerDemandAnalysis: `Buyer demand for ${request.propertyType} properties in ${request.suburb} remains robust, particularly among young professionals and small families. The suburb's proximity to amenities, good schools, and transport links makes it highly desirable. Recent sales indicate buyers are willing to pay premium prices for well-presented properties with modern features.`,
        
        futureTrends: `Looking ahead, ${request.suburb} is expected to continue its positive trajectory. Several infrastructure projects planned for the area are likely to drive further growth. While the broader market may see some cooling, this suburb's unique position and amenities should insulate it from major downturns. We project continued steady growth of 3-4% annually for the next 2-3 years.`,
        
        keySellingPoints: [
          `Strong annual growth rate of ${request.marketTrends?.annualGrowth || 5.2}%`,
          `High demand location with properties selling in just ${request.marketTrends?.daysOnMarket || 28} days`,
          `Excellent amenities including schools, parks, and shopping centers`,
          `Upcoming infrastructure improvements likely to increase property values`,
          `Strong rental yields making it attractive to investors`
        ],
        
        recommendedMarketingStrategy: `For this property, we recommend a targeted marketing campaign highlighting the property's unique features and the strong investment potential of the area. A combination of professional photography, virtual tours, and targeted social media advertising would be most effective. Given the current market conditions, a 3-week auction campaign would likely achieve the best results.`
      },
    };
    
    return response;
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Error generating market analysis',
      error: error.message,
    }));
    
    return {
      success: false,
      error: 'Failed to generate market analysis: ' + error.message,
    };
  }
}

// Handle incoming HTTP requests
serve(async (req: Request) => {
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
  
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Use POST.');
    }
    
    // Parse request body
    const requestData = await req.json();
    
    // Validate request data
    if (!requestData.appraisalId || !requestData.propertyType || !requestData.suburb || !requestData.city) {
      throw new Error('Missing required fields: appraisalId, propertyType, suburb, or city');
    }
    
    // Create Supabase client using environment variables
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Verify JWT token (authentication)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized: Invalid token');
    }
    
    // Log authenticated user
    console.log(JSON.stringify({
      level: 'info',
      message: 'Authenticated user',
      userId: user.id,
    }));
    
    // Generate market analysis
    const analysisRequest: MarketAnalysisRequest = {
      appraisalId: requestData.appraisalId,
      propertyType: requestData.propertyType,
      suburb: requestData.suburb,
      city: requestData.city,
      recentSales: requestData.recentSales,
      marketTrends: requestData.marketTrends,
    };
    
    const analysis = await generateMarketAnalysis(analysisRequest);
    
    // Return response
    return new Response(
      JSON.stringify(analysis),
      { headers }
    );
  } catch (error) {
    // Log error
    console.error(JSON.stringify({
      level: 'error',
      message: 'Error processing request',
      error: error.message,
    }));
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { 
        status: 400, 
        headers 
      }
    );
  }
}); 