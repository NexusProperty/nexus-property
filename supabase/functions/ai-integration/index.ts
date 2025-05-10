// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/hello_world

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
function formatDataForAIPrompt(
  property: {
    address: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    landSize: number;
    yearBuilt?: number;
    title?: string;
    zoning?: string;
    council?: string;
    condition?: string;
    features?: string[];
  },
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
    medianPrice?: number;
    priceChange3Months?: number;
    priceChange12Months?: number;
    averageDaysOnMarket?: number;
    demandLevel?: string;
    suburbName?: string;
    regionName?: string;
  },
  isFullAppraisal: boolean
): string {
  // Format property details
  const propertyDetails = `
PROPERTY DETAILS:
Address: ${property.address}
Type: ${property.propertyType}
Bedrooms: ${property.bedrooms}
Bathrooms: ${property.bathrooms}
Land Size: ${property.landSize} m²
${property.yearBuilt ? `Year Built: ${property.yearBuilt}` : ''}
${property.title ? `Title: ${property.title}` : ''}
${property.zoning ? `Zoning: ${property.zoning}` : ''}
${property.council ? `Council: ${property.council}` : ''}
${property.condition ? `Condition: ${property.condition}` : ''}
${property.features && property.features.length > 0 ? `Features: ${property.features.join(', ')}` : ''}
`;

  // Format market data
  const marketDetails = `
MARKET DATA:
${marketTrends.suburbName ? `Suburb: ${marketTrends.suburbName}` : ''}
${marketTrends.regionName ? `Region: ${marketTrends.regionName}` : ''}
${marketTrends.medianPrice ? `Median Price: $${marketTrends.medianPrice.toLocaleString()}` : ''}
${marketTrends.priceChange3Months ? `3-Month Price Change: ${marketTrends.priceChange3Months}%` : ''}
${marketTrends.priceChange12Months ? `12-Month Price Change: ${marketTrends.priceChange12Months}%` : ''}
${marketTrends.averageDaysOnMarket ? `Average Days on Market: ${marketTrends.averageDaysOnMarket}` : ''}
${marketTrends.demandLevel ? `Demand Level: ${marketTrends.demandLevel}` : ''}
`;

  // Format comparable properties
  const comparableDetails = `
COMPARABLE PROPERTIES:
${comparables.map((comp, index) => `
Comparable ${index + 1}:
Address: ${comp.address}
Sale Price: $${comp.salePrice.toLocaleString()}
Sale Date: ${comp.saleDate}
Distance: ${comp.distanceFromSubject} km
Bedrooms: ${comp.bedrooms}
Bathrooms: ${comp.bathrooms}
Land Size: ${comp.landSize} m²
${comp.buildingSize ? `Building Size: ${comp.buildingSize} m²` : ''}
${comp.features && comp.features.length > 0 ? `Features: ${comp.features.join(', ')}` : ''}
`).join('\n')}
`;

  // Create the prompt with instructions
  const prompt = `
You are a professional real estate appraiser in New Zealand. I need you to analyze the following property data and provide a comprehensive appraisal analysis.

${propertyDetails}
${marketDetails}
${comparableDetails}

Please provide the following analysis:

1. MARKET ANALYSIS: Write a detailed analysis of the current market conditions in this suburb, including trends, demand factors, and how they might affect the property's value.

2. PROPERTY DESCRIPTION: Write a compelling and professional description of the property based on the facts provided.

3. COMPARABLE COMMENTARY: Analyze the comparable properties and explain how they support the valuation. Highlight key differences and similarities.

4. VALUE FACTORS: List the key factors that positively and negatively influence the property's value.

${isFullAppraisal ? 'Provide a detailed, professional analysis suitable for a real estate agent.' : 'Provide a concise, easy-to-understand analysis suitable for a property owner.'}

Format your response with clear section headings (## MARKET ANALYSIS, ## PROPERTY DESCRIPTION, ## COMPARABLE COMMENTARY, ## VALUE FACTORS) and use bullet points for the value factors.
`;

  return prompt;
}

// Function to call Google Cloud Vertex AI (Gemini)
async function callVertexAI(prompt: string): Promise<string> {
  try {
    // In a real implementation, this would call the Google Cloud Vertex AI API
    // For now, we'll simulate a response with a delay
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we have the necessary environment variables
    const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT");
    const location = Deno.env.get("GOOGLE_CLOUD_LOCATION") || "us-central1";
    
    if (!projectId) {
      console.error("GOOGLE_CLOUD_PROJECT environment variable is not set");
      throw new Error("Google Cloud configuration is missing");
    }
    
    // In a real implementation, we would use the Google Cloud Vertex AI client
    // For now, we'll return a mock response
    return mockAIResponse(prompt);
  } catch (error: unknown) {
    console.error("Error calling Vertex AI:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unknown error occurred while calling Vertex AI: ${String(error)}`);
  }
}

// Function to generate a mock AI response
function mockAIResponse(prompt: string): string {
  // Extract property details from the prompt
  const propertyMatch = prompt.match(/Address: (.*?)\n/);
  const propertyAddress = propertyMatch ? propertyMatch[1] : "Unknown Address";
  
  const propertyTypeMatch = prompt.match(/Type: (.*?)\n/);
  const propertyType = propertyTypeMatch ? propertyTypeMatch[1] : "Unknown Type";
  
  const bedroomsMatch = prompt.match(/Bedrooms: (\d+)/);
  const bedrooms = bedroomsMatch ? bedroomsMatch[1] : "Unknown";
  
  const bathroomsMatch = prompt.match(/Bathrooms: (\d+)/);
  const bathrooms = bathroomsMatch ? bathroomsMatch[1] : "Unknown";
  
  const landSizeMatch = prompt.match(/Land Size: (\d+) m²/);
  const landSize = landSizeMatch ? landSizeMatch[1] : "Unknown";
  
  // Extract market data
  const suburbMatch = prompt.match(/Suburb: (.*?)\n/);
  const suburb = suburbMatch ? suburbMatch[1] : "Unknown Suburb";
  
  const medianPriceMatch = prompt.match(/Median Price: \$([\d,]+)/);
  const medianPrice = medianPriceMatch ? medianPriceMatch[1] : "Unknown";
  
  // Extract comparable data
  const comparablesCount = (prompt.match(/Comparable \d+:/g) || []).length;
  
  // Generate a mock response
  return `
## MARKET ANALYSIS
The real estate market in ${suburb} is currently experiencing moderate growth, with median property prices at $${medianPrice}. The market has shown resilience despite economic challenges, with steady demand for properties in this area. The current market conditions suggest a balanced environment between buyers and sellers, with properties typically selling within a reasonable timeframe.

## PROPERTY DESCRIPTION
This ${propertyType} property located at ${propertyAddress} offers a comfortable living space with ${bedrooms} bedrooms and ${bathrooms} bathrooms. The property sits on a ${landSize} m² section, providing ample outdoor space. The home features a well-maintained interior with modern finishes and a functional layout that maximizes the available space.

## COMPARABLE COMMENTARY
The property has been compared to ${comparablesCount} similar properties in the area. These comparables provide valuable insights into the current market value of the subject property. The comparable properties show a range of values that help establish a fair market value for the subject property. Key factors considered in the comparison include location, size, condition, and features.

## VALUE FACTORS
Positive Factors:
- Desirable location in ${suburb}
- Good property size with ${landSize} m² of land
- Well-maintained condition
- Modern features and finishes
- Strong market demand in the area

Negative Factors:
- Some aspects of the property may require updating
- Limited off-street parking
- Proximity to busy roads
- Potential for noise from nearby commercial areas
`;
}

// Function to parse the AI response
function parseAIResponse(response: string): AIGeneratedContent {
  // Extract market analysis
  const marketAnalysisMatch = response.match(/## MARKET ANALYSIS\n([\s\S]*?)(?=##|$)/);
  const marketAnalysis = marketAnalysisMatch ? marketAnalysisMatch[1].trim() : "";
  
  // Extract property description
  const propertyDescriptionMatch = response.match(/## PROPERTY DESCRIPTION\n([\s\S]*?)(?=##|$)/);
  const propertyDescription = propertyDescriptionMatch ? propertyDescriptionMatch[1].trim() : "";
  
  // Extract comparable commentary
  const comparableCommentaryMatch = response.match(/## COMPARABLE COMMENTARY\n([\s\S]*?)(?=##|$)/);
  const comparableCommentaryText = comparableCommentaryMatch ? comparableCommentaryMatch[1].trim() : "";
  
  // Split the comparable commentary into an array of strings
  // Each paragraph is treated as a separate commentary
  const comparableCommentary = comparableCommentaryText
    .split(/\n\n+/)
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0);
  
  // Extract value factors
  const valueFactorsMatch = response.match(/## VALUE FACTORS\n([\s\S]*?)(?=##|$)/);
  const valueFactorsText = valueFactorsMatch ? valueFactorsMatch[1].trim() : "";
  
  // Parse positive and negative factors
  const positiveFactorsMatch = valueFactorsText.match(/Positive Factors:\n([\s\S]*?)(?=Negative Factors:|$)/);
  const positiveFactors = positiveFactorsMatch 
    ? positiveFactorsMatch[1].trim().split('\n').map(factor => factor.replace(/^-\s*/, '').trim())
    : [];
  
  const negativeFactorsMatch = valueFactorsText.match(/Negative Factors:\n([\s\S]*?)(?=$)/);
  const negativeFactors = negativeFactorsMatch 
    ? negativeFactorsMatch[1].trim().split('\n').map(factor => factor.replace(/^-\s*/, '').trim())
    : [];
  
  return {
    marketAnalysis,
    propertyDescription,
    comparableCommentary,
    valueFactors: {
      positive: positiveFactors,
      negative: negativeFactors
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Parse the request body
    const { property, comparables, marketTrends, isFullAppraisal } = await req.json();
    
    // Validate the request
    if (!property || !comparables || !marketTrends) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Format the data for the AI prompt
    const prompt = formatDataForAIPrompt(property, comparables, marketTrends, isFullAppraisal);
    
    // Call the AI service
    const aiResponse = await callVertexAI(prompt);
    
    // Parse the AI response
    const parsedResponse = parseAIResponse(aiResponse);
    
    // Return the parsed response
    return new Response(
      JSON.stringify(parsedResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: unknown) {
    console.error("Error processing request:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}); 