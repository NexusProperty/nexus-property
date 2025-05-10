// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/hello_world

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define the structure for the standardized property data
interface StandardizedPropertyData {
  property: {
    address: string;
    suburb: string;
    city: string;
    postcode: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    landArea: number;
    floorArea: number;
    yearBuilt: number;
    title: string;
    legalDescription: string;
    zoning: string;
    council: string;
    lastSaleDate?: string;
    lastSalePrice?: number;
  };
  salesHistory: {
    sales: {
      date: string;
      price: number;
      type: string;
      source: string;
    }[];
  };
  valuation: {
    estimatedValue: number;
    confidenceScore: number;
    valueRange: {
      min: number;
      max: number;
    };
    lastUpdated: string;
    methodology: string;
  };
  marketData: {
    suburbMedianPrice: number;
    suburbMedianPriceChange: number;
    suburbMedianPriceChangePeriod: string;
    suburbSalesVolume: number;
    suburbSalesVolumeChange: number;
    suburbDaysOnMarket: number;
    suburbDaysOnMarketChange: number;
    suburbActiveListings: number;
    suburbActiveListingsChange: number;
    suburbAuctionClearanceRate: number;
    suburbAuctionClearanceRateChange: number;
  };
  comparables: {
    subjectProperty: {
      address: string;
      suburb: string;
      city: string;
      postcode: string;
      propertyType: string;
      bedrooms: number;
      bathrooms: number;
      landArea: number;
      floorArea: number;
    };
    comparables: {
      address: string;
      suburb: string;
      city: string;
      postcode: string;
      propertyType: string;
      bedrooms: number;
      bathrooms: number;
      landArea: number;
      floorArea: number;
      salePrice: number;
      saleDate: string;
      saleType: string;
      distance: number;
      similarityScore: number;
      features: string[];
    }[];
  };
}

// Define the structure for the AI-generated content
interface AIGeneratedContent {
  marketAnalysis: string;
  propertyDescription: string;
  comparableCommentary: string[];
  valueFactors: {
    positive: string[];
    negative: string[];
  };
}

// Function to format data for the AI prompt
function formatDataForAIPrompt(data: StandardizedPropertyData, isFullAppraisal: boolean): string {
  const { property, valuation, marketData, comparables } = data;
  
  // Format property details
  const propertyDetails = `
PROPERTY DETAILS:
Address: ${property.address}, ${property.suburb}, ${property.city}
Type: ${property.propertyType}
Bedrooms: ${property.bedrooms}
Bathrooms: ${property.bathrooms}
Land Area: ${property.landArea} m²
Floor Area: ${property.floorArea} m²
Year Built: ${property.yearBuilt}
Zoning: ${property.zoning}
Council: ${property.council}
${property.lastSaleDate ? `Last Sale: ${property.lastSaleDate} for $${property.lastSalePrice?.toLocaleString()}` : ''}
`;

  // Format market data
  const marketDetails = `
MARKET DATA:
Suburb Median Price: $${marketData.suburbMedianPrice.toLocaleString()}
Price Change: ${marketData.suburbMedianPriceChange}% (${marketData.suburbMedianPriceChangePeriod})
Sales Volume: ${marketData.suburbSalesVolume} (${marketData.suburbSalesVolumeChange > 0 ? '+' : ''}${marketData.suburbSalesVolumeChange}%)
Days on Market: ${marketData.suburbDaysOnMarket} (${marketData.suburbDaysOnMarketChange > 0 ? '+' : ''}${marketData.suburbDaysOnMarketChange}%)
Active Listings: ${marketData.suburbActiveListings} (${marketData.suburbActiveListingsChange > 0 ? '+' : ''}${marketData.suburbActiveListingsChange}%)
Auction Clearance Rate: ${marketData.suburbAuctionClearanceRate}% (${marketData.suburbAuctionClearanceRateChange > 0 ? '+' : ''}${marketData.suburbAuctionClearanceRateChange}%)
`;

  // Format comparable properties
  const comparableDetails = `
COMPARABLE PROPERTIES:
${comparables.comparables.map((comp, index) => `
Comparable ${index + 1}:
Address: ${comp.address}, ${comp.suburb}
Sale Price: $${comp.salePrice.toLocaleString()}
Sale Date: ${comp.saleDate}
Distance: ${comp.distance} km
Similarity Score: ${comp.similarityScore}%
Bedrooms: ${comp.bedrooms}
Bathrooms: ${comp.bathrooms}
Land Area: ${comp.landArea} m²
Floor Area: ${comp.floorArea} m²
Features: ${comp.features.join(', ')}
`).join('\n')}
`;

  // Format valuation data
  const valuationDetails = `
VALUATION DATA:
Estimated Value: $${valuation.estimatedValue.toLocaleString()}
Confidence Score: ${valuation.confidenceScore}%
Value Range: $${valuation.valueRange.min.toLocaleString()} - $${valuation.valueRange.max.toLocaleString()}
Last Updated: ${valuation.lastUpdated}
Methodology: ${valuation.methodology}
`;

  // Create the prompt with instructions
  const prompt = `
You are a professional real estate appraiser in New Zealand. I need you to analyze the following property data and provide a comprehensive appraisal analysis.

${propertyDetails}
${marketDetails}
${valuationDetails}
${comparableDetails}

Please provide the following analysis:

1. MARKET ANALYSIS: Write a detailed analysis of the current market conditions in this suburb, including trends, demand factors, and how they might affect the property's value.

2. PROPERTY DESCRIPTION: Write a compelling and professional description of the property based on the facts provided.

3. COMPARABLE COMMENTARY: Analyze the comparable properties and explain how they support the valuation range. Highlight key differences and similarities.

4. VALUE FACTORS: List the key factors that positively and negatively influence the property's value.

${isFullAppraisal ? 'Provide a detailed, professional analysis suitable for a real estate agent.' : 'Provide a concise, easy-to-understand analysis suitable for a property owner.'}

Format your response with clear section headings (## MARKET ANALYSIS, ## PROPERTY DESCRIPTION, ## COMPARABLE COMMENTARY, ## VALUE FACTORS) and use bullet points for the value factors.
`;

  return prompt;
}

// Function to call the AI service
async function callAIService(
  property: StandardizedPropertyData['property'],
  comparables: Array<{
    address: string;
    salePrice: number;
    saleDate: string;
    bedrooms: number;
    bathrooms: number;
    landSize: number;
    buildingSize?: number;
    distanceFromSubject: number;
    features?: string[];
  }>,
  marketTrends: {
    medianPrice: number;
    priceChange3Months: number;
    priceChange12Months: number;
    averageDaysOnMarket: number;
    demandLevel: string;
    suburbName: string;
    regionName: string;
  }
): Promise<AIGeneratedContent> {
  try {
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        },
      }
    );

    // Call the AI integration function
    const { data, error } = await supabaseClient.functions.invoke('ai-integration', {
      body: {
        property,
        comparables,
        marketTrends,
        isFullAppraisal: true
      }
    });

    if (error) {
      throw new Error(`Error calling AI integration: ${error.message}`);
    }

    // Parse the response
    const aiResponse = data as AIGeneratedContent;
    
    return aiResponse;
  } catch (error: unknown) {
    console.error('Error calling AI service:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while calling AI service');
  }
}

// Function to process the AI response and structure it for the database
function processAIResponse(aiResponse: AIGeneratedContent, propertyData: StandardizedPropertyData): {
  property_details: {
    address: string;
    suburb: string;
    city: string;
    postcode: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    landArea: number;
    floorArea: number;
    yearBuilt: number;
    title: string;
    legalDescription: string;
    zoning: string;
    council: string;
    lastSaleDate?: string;
    lastSalePrice?: number;
    description?: string;
    features?: string[];
  };
  estimated_value_min: number;
  estimated_value_max: number;
  comparable_properties: Array<{
    address: string;
    salePrice: number;
    bedrooms: number;
    bathrooms: number;
    buildingSize?: number;
    saleDate: string;
    distanceFromSubject: number;
    yearBuilt: number;
    landSize: number;
    propertyType: string;
    commentary: string;
  }>;
  market_analysis: {
    medianPrice: number;
    priceChange3Months: number;
    priceChange12Months: number;
    averageDaysOnMarket: number;
    localMarketTrend: string;
    demandLevel: string;
    analysisText: string;
    valueFactors: {
      positive: string[];
      negative: string[];
    };
  };
} {
  // Extract the market analysis text
  const marketAnalysisText = aiResponse.marketAnalysis;
  
  // Extract the property description text
  const propertyDescriptionText = aiResponse.propertyDescription;
  
  // Extract the comparable commentary text
  const comparableCommentaryText = aiResponse.comparableCommentary.join('\n\n');
  
  // Create the property details object with the AI-generated description
  const propertyDetails = {
    ...propertyData.property,
    description: propertyDescriptionText,
    features: propertyData.comparables.comparables[0]?.features || []
  };
  
  // Create the market analysis object
  const marketAnalysis = {
    medianPrice: propertyData.marketData.suburbMedianPrice,
    priceChange3Months: propertyData.marketData.suburbMedianPriceChange,
    priceChange12Months: propertyData.marketData.suburbMedianPriceChange,
    averageDaysOnMarket: propertyData.marketData.suburbDaysOnMarket,
    localMarketTrend: marketAnalysisText,
    demandLevel: propertyData.marketData.suburbAuctionClearanceRate > 70 ? "High" : 
                 propertyData.marketData.suburbAuctionClearanceRate > 50 ? "Medium" : "Low",
    analysisText: marketAnalysisText,
    valueFactors: aiResponse.valueFactors
  };
  
  // Create the comparable properties array with AI commentary
  const comparableProperties = propertyData.comparables.comparables.map((comp, index) => ({
    address: comp.address,
    salePrice: comp.salePrice,
    bedrooms: comp.bedrooms,
    bathrooms: comp.bathrooms,
    buildingSize: comp.floorArea,
    saleDate: comp.saleDate,
    distanceFromSubject: comp.distance,
    yearBuilt: 0, // Not provided in the data
    landSize: comp.landArea,
    propertyType: comp.propertyType,
    commentary: aiResponse.comparableCommentary[index] || comparableCommentaryText
  }));
  
  // Return the structured data
  return {
    property_details: propertyDetails,
    estimated_value_min: propertyData.valuation.valueRange.min,
    estimated_value_max: propertyData.valuation.valueRange.max,
    comparable_properties: comparableProperties,
    market_analysis: marketAnalysis
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      // Create client with Auth context of the user that called the function.
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the user from the auth context
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the request body
    const { appraisal_id, is_full_appraisal } = await req.json();

    // Validate the request body
    if (!appraisal_id) {
      return new Response(
        JSON.stringify({ error: "Appraisal ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the appraisal record
    const { data: appraisal, error: appraisalError } = await supabaseClient
      .from("appraisals")
      .select("*")
      .eq("id", appraisal_id)
      .single();

    if (appraisalError) {
      return new Response(
        JSON.stringify({ error: "Error fetching appraisal" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if the appraisal is in the correct status
    if (appraisal.status !== "processing") {
      return new Response(
        JSON.stringify({ error: "Appraisal is not in processing status" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // In a real implementation, we would fetch the standardized data from the data ingestion pipeline
    // For now, we'll use mock data
    const mockPropertyData: StandardizedPropertyData = {
      property: {
        address: appraisal.property_address,
        suburb: "Auckland",
        city: "Auckland",
        postcode: "1010",
        propertyType: "Residential",
        bedrooms: 3,
        bathrooms: 2,
        landArea: 500,
        floorArea: 200,
        yearBuilt: 1990,
        title: "Freehold",
        legalDescription: "Lot 123 DP 456789",
        zoning: "Residential",
        council: "Auckland Council",
        lastSaleDate: "2020-01-15",
        lastSalePrice: 750000
      },
      salesHistory: {
        sales: [
          {
            date: "2020-01-15",
            price: 750000,
            type: "Private Treaty",
            source: "CoreLogic"
          }
        ]
      },
      valuation: {
        estimatedValue: 850000,
        confidenceScore: 85,
        valueRange: {
          min: 800000,
          max: 900000
        },
        lastUpdated: new Date().toISOString().split('T')[0],
        methodology: "CoreLogic AVM Model"
      },
      marketData: {
        suburbMedianPrice: 820000,
        suburbMedianPriceChange: 5.2,
        suburbMedianPriceChangePeriod: "last 12 months",
        suburbSalesVolume: 45,
        suburbSalesVolumeChange: 10,
        suburbDaysOnMarket: 25,
        suburbDaysOnMarketChange: -5,
        suburbActiveListings: 12,
        suburbActiveListingsChange: -3,
        suburbAuctionClearanceRate: 75,
        suburbAuctionClearanceRateChange: 5
      },
      comparables: {
        subjectProperty: {
          address: appraisal.property_address,
          suburb: "Auckland",
          city: "Auckland",
          postcode: "1010",
          propertyType: "Residential",
          bedrooms: 3,
          bathrooms: 2,
          landArea: 500,
          floorArea: 200
        },
        comparables: [
          {
            address: "123 Main Street, Auckland",
            suburb: "Auckland",
            city: "Auckland",
            postcode: "1010",
            propertyType: "Residential",
            bedrooms: 3,
            bathrooms: 2,
            landArea: 480,
            floorArea: 190,
            salePrice: 820000,
            saleDate: "2023-03-15",
            saleType: "Auction",
            distance: 0.5,
            similarityScore: 95,
            features: ["Garage", "Deck", "Modern Kitchen"]
          },
          {
            address: "456 Queen Street, Auckland",
            suburb: "Auckland",
            city: "Auckland",
            postcode: "1010",
            propertyType: "Residential",
            bedrooms: 3,
            bathrooms: 1,
            landArea: 450,
            floorArea: 180,
            salePrice: 780000,
            saleDate: "2023-02-10",
            saleType: "Private Treaty",
            distance: 1.2,
            similarityScore: 85,
            features: ["Garage", "Garden"]
          }
        ]
      }
    };

    // Format the data for the AI prompt
    const prompt = formatDataForAIPrompt(mockPropertyData, is_full_appraisal);

    // Prepare the data for the AI service
    const property = {
      address: mockPropertyData.property.address,
      propertyType: mockPropertyData.property.propertyType,
      bedrooms: mockPropertyData.property.bedrooms,
      bathrooms: mockPropertyData.property.bathrooms,
      landSize: mockPropertyData.property.landArea,
      yearBuilt: mockPropertyData.property.yearBuilt,
      title: mockPropertyData.property.title,
      zoning: mockPropertyData.property.zoning,
      council: mockPropertyData.property.council,
      features: mockPropertyData.comparables.comparables[0]?.features || []
    };

    const comparables = mockPropertyData.comparables.comparables.map(comp => ({
      address: comp.address,
      salePrice: comp.salePrice,
      saleDate: comp.saleDate,
      bedrooms: comp.bedrooms,
      bathrooms: comp.bathrooms,
      landSize: comp.landArea,
      buildingSize: comp.floorArea,
      distanceFromSubject: comp.distance,
      features: comp.features
    }));

    const marketTrends = {
      medianPrice: mockPropertyData.marketData.suburbMedianPrice,
      priceChange3Months: mockPropertyData.marketData.suburbMedianPriceChange,
      priceChange12Months: mockPropertyData.marketData.suburbMedianPriceChange,
      averageDaysOnMarket: mockPropertyData.marketData.suburbDaysOnMarket,
      demandLevel: mockPropertyData.marketData.suburbAuctionClearanceRate > 70 ? "High" : 
                   mockPropertyData.marketData.suburbAuctionClearanceRate > 50 ? "Medium" : "Low",
      suburbName: mockPropertyData.property.suburb,
      regionName: mockPropertyData.property.city
    };

    // Call the AI service
    const aiResponse = await callAIService(property, comparables, marketTrends);

    // Process the AI response
    const processedData = processAIResponse(aiResponse, mockPropertyData);

    // Update the appraisal record with the processed data
    const { data: updatedAppraisal, error: updateError } = await supabaseClient
      .from("appraisals")
      .update({
        ...processedData,
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("id", appraisal_id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Error updating appraisal" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ data: updatedAppraisal }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 