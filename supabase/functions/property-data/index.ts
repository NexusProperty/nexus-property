import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { withAuth, getAuthUser } from '../utils/auth-middleware.ts';
import { withCsrfProtection } from '../utils/csrf-middleware.ts';

interface PropertyDataRequest {
  address: string;
  suburb: string;
  city: string;
  propertyType: string;
}

interface PropertyDataResponse {
  success: boolean;
  error?: string;
  data?: {
    propertyDetails: {
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
    };
    comparableProperties: Array<{
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
    }>;
    marketTrends: {
      medianPrice: number;
      annualGrowth: number;
      salesVolume: number;
      daysOnMarket: number;
    };
  };
}

// Mock API for property data
// In a real implementation, this would call an external API
async function fetchPropertyData(request: PropertyDataRequest): Promise<PropertyDataResponse> {
  // Log the request details
  console.log(JSON.stringify({
    level: 'info',
    message: 'Fetching property data',
    request,
  }));
  
  try {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response data
    // In a real implementation, this would come from the external API
    const response: PropertyDataResponse = {
      success: true,
      data: {
        propertyDetails: {
          address: request.address,
          suburb: request.suburb,
          city: request.city,
          postcode: '1010', // Mock data
          propertyType: request.propertyType,
          bedrooms: 3,
          bathrooms: 2,
          landSize: 650,
          floorArea: 180,
          yearBuilt: 2005,
          features: ['Garage', 'Garden', 'Renovated Kitchen'],
        },
        comparableProperties: [
          {
            address: '21 Sample Street',
            suburb: request.suburb,
            city: request.city,
            propertyType: request.propertyType,
            bedrooms: 3,
            bathrooms: 2,
            landSize: 620,
            floorArea: 175,
            yearBuilt: 2007,
            saleDate: '2023-11-15',
            salePrice: 950000,
            similarityScore: 95,
            imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233',
          },
          {
            address: '45 Example Road',
            suburb: request.suburb,
            city: request.city,
            propertyType: request.propertyType,
            bedrooms: 3,
            bathrooms: 1,
            landSize: 600,
            floorArea: 165,
            yearBuilt: 2000,
            saleDate: '2023-10-20',
            salePrice: 920000,
            similarityScore: 88,
            imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
          },
          {
            address: '12 Test Avenue',
            suburb: request.suburb,
            city: request.city,
            propertyType: request.propertyType,
            bedrooms: 4,
            bathrooms: 2,
            landSize: 700,
            floorArea: 200,
            yearBuilt: 2010,
            saleDate: '2023-09-05',
            salePrice: 1050000,
            similarityScore: 82,
            imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
          },
        ],
        marketTrends: {
          medianPrice: 980000,
          annualGrowth: 5.2,
          salesVolume: 45,
          daysOnMarket: 28,
        },
      },
    };
    
    return response;
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Error fetching property data',
      error: error.message,
    }));
    
    return {
      success: false,
      error: 'Failed to fetch property data: ' + error.message,
    };
  }
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
        
        // Parse request body
        const requestData = await req.json();
        
        // Validate request data
        if (!requestData.address || !requestData.suburb || !requestData.city || !requestData.propertyType) {
          throw new Error('Missing required fields: address, suburb, city, or propertyType');
        }
        
        // Fetch property data
        const propertyDataRequest: PropertyDataRequest = {
          address: requestData.address,
          suburb: requestData.suburb,
          city: requestData.city,
          propertyType: requestData.propertyType,
        };
        
        const propertyData = await fetchPropertyData(propertyDataRequest);
        
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
    }, { requireAuth: true }),
    { enforceForMutations: true }
  )
); 