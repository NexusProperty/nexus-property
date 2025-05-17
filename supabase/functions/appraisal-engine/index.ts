import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { withAuth, getAuthUser } from '../utils/auth-middleware.ts';
import { withCsrfProtection } from '../utils/csrf-middleware.ts';

// Import types for stronger typing
interface AppraisalDataRequest {
  propertyId?: string;
  address?: string;
  suburb?: string;
  city?: string;
  postcode?: string;
  bedrooms?: number;
  bathrooms?: number;
  landArea?: number;
  floorArea?: number;
  propertyType?: string;
  yearBuilt?: number;
  condition?: string;
  amenities?: string[];
  includeComparables?: boolean;
  includeMarketData?: boolean;
  includeAvm?: boolean;
  includeBranding?: boolean;
}

interface AppraisalDataResponse {
  success: boolean;
  error?: string;
  data?: {
    property: {
      propertyId: string;
      address: string;
      suburb: string;
      city: string;
      postcode: string;
      attributes: {
        bedrooms: number;
        bathrooms: number;
        landArea: number;
        floorArea: number;
        propertyType: string;
        yearBuilt?: number;
        condition?: string;
        amenities?: string[];
        [key: string]: any;
      };
      images: {
        url: string;
        type: string;
        date?: string;
      }[];
      titleDetails?: {
        owners: string[];
        legalDescription: string;
        titleReference: string;
        registrationDate?: string;
        [key: string]: any;
      };
    };
    valuations: {
      avm?: {
        value: number;
        confidence: number;
        valueRange: {
          low: number;
          high: number;
        };
        lastUpdated: string;
        provider: string;
      };
      sales: {
        date: string;
        price: number;
        type: string;
        buyer?: string;
        seller?: string;
      }[];
    };
    comparables?: {
      properties: {
        propertyId: string;
        address: string;
        saleDate: string;
        salePrice: number;
        attributes: {
          bedrooms: number;
          bathrooms: number;
          landArea: number;
          floorArea: number;
          propertyType: string;
          yearBuilt?: number;
          [key: string]: any;
        };
        adjustments?: {
          factor: number;
          reason: string;
        }[];
        adjustedPrice: number;
        images?: {
          url: string;
          type: string;
        }[];
      }[];
      averageAdjustedPrice: number;
      medianAdjustedPrice: number;
      priceRange: {
        low: number;
        high: number;
      };
    };
    marketData?: {
      suburb: {
        medianPrice: number;
        priceChange: {
          monthly: number;
          quarterly: number;
          yearly: number;
        };
        daysOnMarket: number;
        salesVolume: number;
        listingVolume: number;
      };
      city: {
        medianPrice: number;
        priceChange: {
          monthly: number;
          quarterly: number;
          yearly: number;
        };
      };
      trends: {
        priceDirection: string;
        supplyDemand: string;
        buyerActivity: string;
      };
    };
    propertyActivity?: {
      listings: {
        startDate: string;
        endDate?: string;
        askingPrice?: number;
        agency?: string;
        status: string;
      }[];
      ownershipChanges: {
        date: string;
        price?: number;
        buyer?: string;
        seller?: string;
        type: string;
      }[];
    };
    branding?: {
      agencyLogo?: string;
      agencyPrimaryColor?: string;
      agencyDisclaimerText?: string;
      agencyContactDetails?: string;
      agentPhoto?: string;
      agentName?: string;
      agentLicenseNumber?: string;
      agentContactInfo?: string;
    };
    aiContent?: {
      marketOverview?: string;
      propertyDescription?: string;
      comparableAnalysis?: string;
    };
  };
}

/**
 * Main function to handle appraisal data requests
 */
async function fetchAppraisalData(
  request: AppraisalDataRequest,
  supabase: SupabaseClient,
  userId: string
): Promise<AppraisalDataResponse> {
  // Log the request
  console.log(JSON.stringify({
    level: 'info',
    message: 'Processing appraisal data request',
    userId,
    request
  }));

  try {
    // Create a base URL for making API calls to other Edge Functions
    const baseUrl = Deno.env.get('SUPABASE_URL') || '';
    const apiKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    // Check if we need to create a property data request
    const propertyDataNeeded = !!(request.propertyId || request.address);
    let propertyData = null;

    // 1. Fetch property data if needed
    if (propertyDataNeeded) {
      const propertyDataUrl = `${baseUrl}/functions/v1/property-data`;
      const propertyResponse = await fetch(propertyDataUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          propertyId: request.propertyId,
          address: request.address,
          suburb: request.suburb,
          city: request.city,
          postcode: request.postcode,
          yearBuilt: request.yearBuilt,
          condition: request.condition,
          amenities: request.amenities,
          propertyType: request.propertyType,
          includeComparables: request.includeComparables,
          includeAvm: request.includeAvm
        })
      });

      if (!propertyResponse.ok) {
        throw new Error(`Property data service error: ${propertyResponse.status}`);
      }

      propertyData = await propertyResponse.json();
      
      if (!propertyData.success) {
        throw new Error(propertyData.error || 'Failed to fetch property data');
      }

      // Log successful property data retrieval
      console.log(JSON.stringify({
        level: 'info',
        message: 'Retrieved property data',
        propertyId: propertyData.data.propertyId,
        address: propertyData.data.addressDetails.address
      }));
    }

    // 2. Fetch market data if needed
    let marketData = null;
    if (request.includeMarketData && propertyData) {
      const suburb = propertyData.data.addressDetails.addressComponents.suburb || request.suburb;
      const city = propertyData.data.addressDetails.addressComponents.city || request.city;
      
      if (suburb && city) {
        const marketDataUrl = `${baseUrl}/functions/v1/market-data`;
        const marketResponse = await fetch(marketDataUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            suburb: suburb,
            city: city,
            propertyType: request.propertyType || propertyData.data.propertyAttributes.propertyType,
            bedrooms: request.bedrooms || propertyData.data.propertyAttributes.bedrooms,
            yearBuilt: request.yearBuilt || propertyData.data.propertyAttributes.yearBuilt
          })
        });

        if (!marketResponse.ok) {
          console.log(JSON.stringify({
            level: 'warn',
            message: 'Market data service error',
            status: marketResponse.status
          }));
        } else {
          marketData = await marketResponse.json();
          
          if (!marketData.success) {
            console.log(JSON.stringify({
              level: 'warn',
              message: 'Failed to fetch market data',
              error: marketData.error
            }));
            marketData = null;
          } else {
            // Log successful market data retrieval
            console.log(JSON.stringify({
              level: 'info',
              message: 'Retrieved market data',
              suburb,
              city
            }));
          }
        }
      }
    }

    // 3. Combine the data into a unified response
    const response: AppraisalDataResponse = {
      success: true,
      data: {
        property: {
          propertyId: propertyData?.data.propertyId || '',
          address: propertyData?.data.addressDetails.address || request.address || '',
          suburb: propertyData?.data.addressDetails.addressComponents.suburb || request.suburb || '',
          city: propertyData?.data.addressDetails.addressComponents.city || request.city || '',
          postcode: propertyData?.data.addressDetails.addressComponents.postcode || request.postcode || '',
          attributes: {
            bedrooms: propertyData?.data.propertyAttributes.bedrooms || request.bedrooms || 0,
            bathrooms: propertyData?.data.propertyAttributes.bathrooms || request.bathrooms || 0,
            landArea: propertyData?.data.propertyAttributes.landArea || request.landArea || 0,
            floorArea: propertyData?.data.propertyAttributes.floorArea || request.floorArea || 0,
            propertyType: propertyData?.data.propertyAttributes.propertyType || request.propertyType || 'RESIDENTIAL',
            yearBuilt: propertyData?.data.propertyAttributes.yearBuilt,
            condition: propertyData?.data.propertyAttributes.condition,
            amenities: propertyData?.data.propertyAttributes.amenities
          },
          images: propertyData?.data.propertyImages || [],
          titleDetails: propertyData?.data.titleDetails
        },
        valuations: {
          avm: propertyData?.data.avm,
          sales: propertyData?.data.salesHistory || []
        }
      }
    };

    // Add comparables if available
    if (propertyData?.data.comparables) {
      response.data.comparables = propertyData.data.comparables;
    }

    // Add market data if available
    if (marketData?.data) {
      response.data.marketData = {
        suburb: {
          medianPrice: marketData.data.currentSnapshot.medianSalePrice,
          priceChange: {
            monthly: 0, // Calculated from historical data
            quarterly: marketData.data.currentSnapshot.priceChangeQoQ,
            yearly: marketData.data.currentSnapshot.priceChangeYoY
          },
          daysOnMarket: marketData.data.currentSnapshot.medianDaysOnMarket,
          salesVolume: marketData.data.currentSnapshot.salesVolume,
          listingVolume: marketData.data.currentSnapshot.activeListings
        },
        city: {
          medianPrice: marketData.data.suburbComparison.comparisonSuburbs.reduce(
            (sum, suburb) => sum + suburb.medianPrice, 0
          ) / marketData.data.suburbComparison.comparisonSuburbs.length,
          priceChange: {
            monthly: 0,
            quarterly: 0,
            yearly: marketData.data.suburbComparison.comparisonSuburbs.reduce(
              (sum, suburb) => sum + suburb.priceChangeYoY, 0
            ) / marketData.data.suburbComparison.comparisonSuburbs.length
          }
        },
        trends: {
          priceDirection: marketData.data.trendAnalysis.priceTrend.current,
          supplyDemand: marketData.data.trendAnalysis.supplyDemand.balance,
          buyerActivity: marketData.data.trendAnalysis.marketActivity.current
        }
      };
    }

    // Add property activity if available
    if (propertyData?.data.propertyActivity) {
      response.data.propertyActivity = propertyData.data.propertyActivity;
    }

    // 4. Fetch branding data if requested
    if (request.includeBranding) {
      try {
        // First, get the user's team_id from profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('team_id')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.log(JSON.stringify({
            level: 'warn',
            message: 'Failed to fetch user profile for branding',
            error: profileError.message
          }));
        } else if (profileData?.team_id) {
          // Fetch team branding data
          const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select(`
              agency_logo_url,
              agency_primary_color,
              agency_disclaimer_text,
              agency_contact_details
            `)
            .eq('id', profileData.team_id)
            .single();

          if (teamError) {
            console.log(JSON.stringify({
              level: 'warn',
              message: 'Failed to fetch team branding data',
              error: teamError.message
            }));
          } else {
            // Fetch agent-specific data from profiles
            const { data: agentData, error: agentError } = await supabase
              .from('profiles')
              .select(`
                full_name,
                agent_photo_url,
                agent_license_number,
                email,
                phone
              `)
              .eq('id', userId)
              .single();

            if (agentError) {
              console.log(JSON.stringify({
                level: 'warn',
                message: 'Failed to fetch agent profile data',
                error: agentError.message
              }));
            }

            // Add branding data to response
            response.data.branding = {
              agencyLogo: teamData?.agency_logo_url,
              agencyPrimaryColor: teamData?.agency_primary_color,
              agencyDisclaimerText: teamData?.agency_disclaimer_text,
              agencyContactDetails: teamData?.agency_contact_details,
              agentPhoto: agentData?.agent_photo_url,
              agentName: agentData?.full_name,
              agentLicenseNumber: agentData?.agent_license_number,
              agentContactInfo: `${agentData?.email || ''}${agentData?.phone ? ` | ${agentData.phone}` : ''}`
            };

            console.log(JSON.stringify({
              level: 'info',
              message: 'Retrieved branding data for report',
              teamId: profileData.team_id,
              userId
            }));
          }
        }
      } catch (brandingError) {
        console.log(JSON.stringify({
          level: 'warn',
          message: 'Exception fetching branding data',
          error: brandingError instanceof Error ? brandingError.message : String(brandingError)
        }));
      }
    }

    // 5. Fetch AI-generated content if available
    try {
      const { data: appraisalData, error: appraisalError } = await supabase
        .from('appraisals')
        .select(`
          ai_market_overview,
          ai_property_description,
          ai_comparable_analysis_text
        `)
        .eq('property_id', response.data.property.propertyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (appraisalError) {
        console.log(JSON.stringify({
          level: 'info',
          message: 'No AI content found for the property',
          propertyId: response.data.property.propertyId
        }));
      } else if (appraisalData) {
        response.data.aiContent = {
          marketOverview: appraisalData.ai_market_overview,
          propertyDescription: appraisalData.ai_property_description,
          comparableAnalysis: appraisalData.ai_comparable_analysis_text
        };

        console.log(JSON.stringify({
          level: 'info',
          message: 'Retrieved AI content for report',
          propertyId: response.data.property.propertyId,
          hasMarketOverview: !!appraisalData.ai_market_overview,
          hasPropertyDescription: !!appraisalData.ai_property_description,
          hasComparableAnalysis: !!appraisalData.ai_comparable_analysis_text
        }));
      }
    } catch (aiContentError) {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Exception fetching AI content',
        error: aiContentError instanceof Error ? aiContentError.message : String(aiContentError)
      }));
    }

    // Log the successful response
    console.log(JSON.stringify({
      level: 'info',
      message: 'Generated appraisal data response',
      propertyId: response.data.property.propertyId,
      address: response.data.property.address,
      dataIncluded: {
        property: true,
        valuations: !!response.data.valuations,
        comparables: !!response.data.comparables,
        marketData: !!response.data.marketData,
        propertyActivity: !!response.data.propertyActivity,
        branding: !!response.data.branding,
        aiContent: !!response.data.aiContent
      }
    }));

    // Record this appraisal data request in the database for analytics
    try {
      const { error } = await supabase
        .from('appraisal_data_requests')
        .insert({
          user_id: userId,
          property_id: response.data.property.propertyId,
          address: response.data.property.address,
          suburb: response.data.property.suburb,
          city: response.data.property.city,
          has_property_data: !!propertyData,
          has_comparables: !!response.data.comparables,
          has_market_data: !!response.data.marketData,
          has_avm: !!response.data.valuations.avm,
          has_branding: !!response.data.branding,
          has_ai_content: !!response.data.aiContent
        });

      if (error) {
        console.log(JSON.stringify({
          level: 'warn',
          message: 'Failed to record appraisal data request',
          error: error.message
        }));
      }
    } catch (dbError) {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Exception recording appraisal data request',
        error: dbError instanceof Error ? dbError.message : String(dbError)
      }));
    }

    return response;
  } catch (error) {
    // Log the error
    console.error(JSON.stringify({
      level: 'error',
      message: 'Error processing appraisal data',
      error: error instanceof Error ? error.message : String(error),
      request
    }));
    
    // Return error response
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Define the main handler for the Edge Function
serve(
  withCsrfProtection(
    withAuth(async (req: Request) => {
      // CORS headers
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Content-Type': 'application/json',
      };
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return new Response('ok', { headers });
      }
      
      try {
        // Get the authenticated user
        const authUser = getAuthUser(req);
        if (!authUser) {
          throw new Error('User authentication required');
        }

        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Parse request body
        const requestData: AppraisalDataRequest = await req.json();
        
        // Process the appraisal data request
        const response = await fetchAppraisalData(requestData, supabase, authUser.userId);
        
        // Return the response
        return new Response(
          JSON.stringify(response),
          { headers }
        );
      } catch (error) {
        // Log the error
        console.error(JSON.stringify({
          level: 'error',
          message: 'Request handler error',
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