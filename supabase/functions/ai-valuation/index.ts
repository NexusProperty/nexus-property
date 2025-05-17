import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { withCsrfProtection } from '../utils/csrf-middleware.ts';
import { withAuth, getAuthUser } from '../utils/auth-middleware.ts';

// Types for appraisal-related data
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
  features?: string[];
  description?: string;
  architecturalStyle?: string;
  constructionMaterials?: string[];
  condition?: string;
  quality?: string;
  view?: string;
  aspect?: string;
  // Enhanced property attributes
  renovation_history?: {
    last_renovated?: number;
    renovation_quality?: string;
    major_renovations?: string[];
  };
  energy_efficiency?: {
    rating?: string;
    features?: string[];
  };
  outdoor_features?: string[];
  indoor_features?: string[];
  zoning?: string;
  schoolZones?: string[];
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
  listingDate?: string;
  soldDate?: string;
  daysOnMarket?: number;
  similarityScore: number;
  distanceKm?: number;
  adjustedPrice?: number;
}

interface MarketData {
  medianPrice?: number;
  pricePerSqm?: number;
  annualGrowth?: number;
  quarterlyGrowth?: number;
  salesVolume?: {
    current?: number;
    previousPeriod?: number;
    yearAgo?: number;
    percentageChange?: number;
  };
  daysOnMarket?: number;
  marketType?: 'Buyer' | 'Neutral' | 'Seller';
  suburb?: string;
  city?: string;
  propertyTypeBreakdown?: Record<string, {
    medianPrice: number;
    annualGrowth: number;
    inventory: number;
  }>;
  inventoryLevels?: {
    current: number;
    previousPeriod: number;
    yearAgo: number;
    percentageChange?: number;
  };
}

interface ValuationData {
  valuationLow: number;
  valuationMid: number;
  valuationHigh: number;
  valuationConfidence: number;
  confidenceCategory: string;
  valuationSources?: {
    comparableBased?: {
      low: number;
      mid: number;
      high: number;
      confidence: number;
      methodologyNotes?: string;
    };
    corelogicAvm?: {
      low: number;
      estimate: number;
      high: number;
      confidenceLabel: string;
      lastUpdated?: string;
    };
    reinzAvm?: {
      estimate: number;
      confidenceLevel?: string;
    };
    blendRatio?: string;
    hybridMethodology?: string;
  };
  confidenceBreakdown?: {
    dataQuality: number;
    comparableRelevance: number;
    dataRecency: number;
    marketVolatility: number;
    propertyComplexityFactor: number;
  };
}

interface AIValuationRequest {
  appraisalId: string;
  propertyDetails: PropertyDetails;
  comparableProperties: ComparableProperty[];
  marketData: MarketData;
  valuationData: ValuationData;
  requestType: 'market_overview' | 'property_description' | 'comparable_analysis' | 'all';
  options?: {
    detailLevel?: 'concise' | 'standard' | 'detailed';
    tone?: 'professional' | 'conversational' | 'enthusiastic';
    focusAreas?: string[];
    maxTokens?: number;
    temperature?: number;
    includeTechnicalDetails?: boolean;
  };
}

interface AIValuationResponse {
  success: boolean;
  error?: string;
  data?: {
    market_overview?: string;
    property_description?: string;
    comparable_analysis?: string;
  };
}

// Generate enhanced market overview with detailed analysis
async function generateMarketOverview(
  propertyDetails: PropertyDetails,
  marketData: MarketData,
  valuationData: ValuationData,
  options?: AIValuationRequest['options']
): Promise<string> {
  // Default options
  const detailLevel = options?.detailLevel || 'standard';
  const tone = options?.tone || 'professional';
  const maxTokens = options?.maxTokens || 600;
  const temperature = options?.temperature || 0.3;
  const includeTechnicalDetails = options?.includeTechnicalDetails || false;
  
  // Format growth rates for readability
  const formatGrowth = (growth?: number) => {
    if (growth === undefined) return 'unknown';
    return `${(growth * 100).toFixed(1)}%${growth >= 0 ? ' increase' : ' decrease'}`;
  };
  
  // Create more detailed market context based on data provided
  const marketAnalysis = [];
  
  if (marketData.annualGrowth !== undefined) {
    marketAnalysis.push(`Annual growth: ${formatGrowth(marketData.annualGrowth)}`);
  }
  
  if (marketData.quarterlyGrowth !== undefined) {
    marketAnalysis.push(`Quarterly growth: ${formatGrowth(marketData.quarterlyGrowth)}`);
  }
  
  if (marketData.medianPrice !== undefined) {
    marketAnalysis.push(`Median price: $${marketData.medianPrice.toLocaleString()}`);
  }
  
  if (marketData.daysOnMarket !== undefined) {
    marketAnalysis.push(`Average days on market: ${marketData.daysOnMarket}`);
  }
  
  if (marketData.salesVolume?.current !== undefined) {
    marketAnalysis.push(`Sales volume: ${marketData.salesVolume.current} properties`);
    
    if (marketData.salesVolume.percentageChange !== undefined) {
      marketAnalysis.push(`Sales volume change: ${formatGrowth(marketData.salesVolume.percentageChange)}`);
    }
  }
  
  if (marketData.inventoryLevels?.current !== undefined) {
    marketAnalysis.push(`Current inventory: ${marketData.inventoryLevels.current} properties`);
    
    if (marketData.inventoryLevels.percentageChange !== undefined) {
      marketAnalysis.push(`Inventory change: ${formatGrowth(marketData.inventoryLevels.percentageChange)}`);
    }
  }
  
  // Create a detailed market context prompt
  const prompt = `
As a leading property market analyst, provide a comprehensive market overview for ${propertyDetails.suburb}, ${propertyDetails.city}, focusing on the current conditions for ${propertyDetails.propertyType} properties.

MARKET DATA:
${marketAnalysis.join('\n')}
Market type: ${marketData.marketType || 'Balanced'}

PROPERTY DETAILS:
Property type: ${propertyDetails.propertyType}
Location: ${propertyDetails.suburb}, ${propertyDetails.city}
Valuation range: $${valuationData.valuationLow.toLocaleString()} to $${valuationData.valuationHigh.toLocaleString()}
Valuation confidence: ${valuationData.confidenceCategory}

${detailLevel === 'detailed' ? `
ADDITIONAL CONTEXT:
Property specifics: ${propertyDetails.bedrooms} bedrooms, ${propertyDetails.bathrooms} bathrooms, ${propertyDetails.floorArea}m² living area
Zoning: ${propertyDetails.zoning || 'Standard residential'}
School zones: ${propertyDetails.schoolZones?.join(', ') || 'Standard local schools'}
` : ''}

Please write a ${detailLevel} ${tone} market overview that:
1. Summarizes current market conditions in ${propertyDetails.suburb}
2. Analyzes price trends for ${propertyDetails.propertyType} properties in this area
3. Discusses supply and demand factors
4. Provides a forward-looking market outlook
${includeTechnicalDetails ? '5. Includes technical market metrics and their implications' : ''}

The overview should be insightful, data-driven, and provide valuable context for the property valuation.
`.trim();

  // Log the generated prompt
  console.log(JSON.stringify({
    level: 'info',
    message: 'Generated market overview prompt',
    promptLength: prompt.length,
    detailLevel,
    tone
  }));

  // Call AI to generate the content
  return await callVertexAI(prompt, {
    maxTokens,
    temperature
  });
}

// Generate enhanced property description
async function generatePropertyDescription(
  propertyDetails: PropertyDetails,
  valuationData: ValuationData,
  options?: AIValuationRequest['options']
): Promise<string> {
  // Default options
  const detailLevel = options?.detailLevel || 'standard';
  const tone = options?.tone || 'professional';
  const maxTokens = options?.maxTokens || 600;
  const temperature = options?.temperature || 0.4; // Slightly higher temp for creativity
  
  // Build comprehensive features list
  const features: string[] = propertyDetails.features || [];
  
  // Add property core features if not already included
  if (propertyDetails.bedrooms && !features.includes(`${propertyDetails.bedrooms} bedrooms`)) {
    features.push(`${propertyDetails.bedrooms} bedrooms`);
  }
  
  if (propertyDetails.bathrooms && !features.includes(`${propertyDetails.bathrooms} bathrooms`)) {
    features.push(`${propertyDetails.bathrooms} bathrooms`);
  }
  
  if (propertyDetails.landSize && !features.some(f => f.includes('land'))) {
    features.push(`${propertyDetails.landSize}m² land`);
  }
  
  if (propertyDetails.floorArea && !features.some(f => f.includes('floor area'))) {
    features.push(`${propertyDetails.floorArea}m² floor area`);
  }
  
  if (propertyDetails.yearBuilt && !features.some(f => f.includes('built'))) {
    features.push(`Built in ${propertyDetails.yearBuilt}`);
  }
  
  // Add architectural features
  if (propertyDetails.architecturalStyle) {
    features.push(`${propertyDetails.architecturalStyle} style`);
  }
  
  // Add construction materials
  if (propertyDetails.constructionMaterials?.length) {
    features.push(`${propertyDetails.constructionMaterials.join('/')} construction`);
  }
  
  // Add condition and quality
  if (propertyDetails.condition) {
    features.push(`${propertyDetails.condition} condition`);
  }
  
  if (propertyDetails.quality) {
    features.push(`${propertyDetails.quality} quality finishes`);
  }
  
  // Add view and aspect
  if (propertyDetails.view) {
    features.push(`${propertyDetails.view} views`);
  }
  
  if (propertyDetails.aspect) {
    features.push(`${propertyDetails.aspect} aspect`);
  }
  
  // Add renovation history
  if (propertyDetails.renovation_history?.last_renovated) {
    features.push(`Renovated in ${propertyDetails.renovation_history.last_renovated}`);
    
    if (propertyDetails.renovation_history.renovation_quality) {
      features.push(`${propertyDetails.renovation_history.renovation_quality} quality renovation`);
    }
    
    if (propertyDetails.renovation_history.major_renovations?.length) {
      features.push(`Major renovations: ${propertyDetails.renovation_history.major_renovations.join(', ')}`);
    }
  }
  
  // Add energy efficiency
  if (propertyDetails.energy_efficiency?.rating) {
    features.push(`Energy efficiency rating: ${propertyDetails.energy_efficiency.rating}`);
  }
  
  if (propertyDetails.energy_efficiency?.features?.length) {
    features.push(`Energy features: ${propertyDetails.energy_efficiency.features.join(', ')}`);
  }
  
  // Add outdoor features
  if (propertyDetails.outdoor_features?.length) {
    propertyDetails.outdoor_features.forEach(feature => features.push(feature));
  }
  
  // Add indoor features
  if (propertyDetails.indoor_features?.length) {
    propertyDetails.indoor_features.forEach(feature => features.push(feature));
  }
  
  // Create a detailed property description prompt
  const prompt = `
As a professional property copywriter, create a compelling ${detailLevel} description for this ${propertyDetails.propertyType} in ${propertyDetails.suburb}, ${propertyDetails.city}.

PROPERTY DETAILS:
Address: ${propertyDetails.address}
Property type: ${propertyDetails.propertyType}
Valuation range: $${valuationData.valuationLow.toLocaleString()} to $${valuationData.valuationHigh.toLocaleString()}

KEY FEATURES:
${features.map(f => `- ${f}`).join('\n')}

${propertyDetails.description ? `EXISTING DESCRIPTION:\n${propertyDetails.description}\n` : ''}

Write a ${tone}, ${detailLevel} property description that:
1. Creates an engaging introduction highlighting the property's unique appeal
2. Emphasizes the key features and selling points
3. Describes the location benefits and lifestyle aspects
4. Uses descriptive, appealing language appropriate for marketing material
5. Creates a clear mental picture of the property for potential buyers

The description should be factually accurate while highlighting the property's best features.
`.trim();

  // Log the generated prompt
  console.log(JSON.stringify({
    level: 'info',
    message: 'Generated property description prompt',
    promptLength: prompt.length,
    detailLevel,
    tone
  }));

  // Call AI to generate the content
  return await callVertexAI(prompt, {
    maxTokens,
    temperature
  });
}

// Generate enhanced comparable analysis
async function generateComparableAnalysis(
  propertyDetails: PropertyDetails,
  comparableProperties: ComparableProperty[],
  valuationData: ValuationData,
  options?: AIValuationRequest['options']
): Promise<string> {
  // Default options
  const detailLevel = options?.detailLevel || 'standard';
  const tone = options?.tone || 'professional';
  const maxTokens = options?.maxTokens || 700;
  const temperature = options?.temperature || 0.3;
  const includeTechnicalDetails = options?.includeTechnicalDetails || false;
  
  // Sort comparables by similarity score and select top ones
  const topComparables = [...comparableProperties]
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 5);
  
  // Format comparables for detailed analysis
  const formattedComparables = topComparables.map((comp, index) => {
    return `
COMPARABLE #${index + 1}: ${comp.address} - $${comp.salePrice?.toLocaleString()}
- Property type: ${comp.propertyType}
- Specifications: ${comp.bedrooms} bed, ${comp.bathrooms} bath, ${comp.floorArea}m² living area, ${comp.landSize}m² land
- Sale date: ${comp.saleDate || 'Recent'}
- Similarity score: ${comp.similarityScore}%
- Distance: ${comp.distanceKm?.toFixed(1)}km
${comp.adjustedPrice ? `- Adjusted price: $${Math.round(comp.adjustedPrice).toLocaleString()}` : ''}
`.trim();
  }).join('\n\n');
  
  // Create a comprehensive comparable analysis prompt
  const prompt = `
As a property valuation expert, provide a detailed analysis of how the subject property compares to recent sales in ${propertyDetails.suburb}, ${propertyDetails.city}. This analysis will help explain the valuation to the property owner.

SUBJECT PROPERTY:
- ${propertyDetails.propertyType} at ${propertyDetails.address}
- ${propertyDetails.bedrooms} bedrooms, ${propertyDetails.bathrooms} bathrooms
- ${propertyDetails.floorArea}m² living area, ${propertyDetails.landSize}m² land
${propertyDetails.yearBuilt ? `- Built in ${propertyDetails.yearBuilt}` : ''}
${propertyDetails.condition ? `- Condition: ${propertyDetails.condition}` : ''}
${propertyDetails.quality ? `- Quality: ${propertyDetails.quality}` : ''}

VALUATION RESULTS:
- Valuation range: $${valuationData.valuationLow.toLocaleString()} to $${valuationData.valuationHigh.toLocaleString()}
- Valuation midpoint: $${valuationData.valuationMid.toLocaleString()}
- Confidence level: ${valuationData.confidenceCategory}
${valuationData.valuationSources?.blendRatio ? `- Valuation method: ${valuationData.valuationSources.blendRatio}` : ''}

COMPARABLE PROPERTIES:
${formattedComparables}

${includeTechnicalDetails && valuationData.confidenceBreakdown ? `
TECHNICAL VALUATION FACTORS:
- Data quality: ${(valuationData.confidenceBreakdown.dataQuality * 100).toFixed(0)}%
- Comparable relevance: ${(valuationData.confidenceBreakdown.comparableRelevance * 100).toFixed(0)}%
- Data recency: ${(valuationData.confidenceBreakdown.dataRecency * 100).toFixed(0)}%
- Market volatility: ${(valuationData.confidenceBreakdown.marketVolatility * 100).toFixed(0)}%
- Property complexity: ${(valuationData.confidenceBreakdown.propertyComplexityFactor * 100).toFixed(0)}%
` : ''}

Write a ${tone}, ${detailLevel} comparable analysis that:
1. Explains how the comparable properties support the valuation range
2. Identifies the key factors that influence the property's value
3. Highlights which comparables are most relevant and why
4. Explains adjustments made between the subject property and comparables
5. Provides insight into the confidence level of the valuation
${includeTechnicalDetails ? '6. Explains the technical valuation factors in simple terms' : ''}

The analysis should be clear, insightful, and help the property owner understand how the valuation was derived.
`.trim();

  // Log the generated prompt
  console.log(JSON.stringify({
    level: 'info',
    message: 'Generated comparable analysis prompt',
    promptLength: prompt.length,
    detailLevel,
    tone
  }));

  // Call AI to generate the content
  return await callVertexAI(prompt, {
    maxTokens,
    temperature
  });
}

// Enhanced AI call function
async function callVertexAI(
  prompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  try {
    // Get API key from environment
    const apiKey = Deno.env.get('GOOGLE_VERTEX_API_KEY') || '';
    
    if (!apiKey) {
      throw new Error('Google Vertex AI API key not found');
    }
    
    // Call the Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: options.temperature || 0.3,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: options.maxTokens || 800,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_ONLY_HIGH"
            }
          ]
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    
    // Verify response format and extract content
    if (!data.candidates || 
        !data.candidates[0] || 
        !data.candidates[0].content || 
        !data.candidates[0].content.parts || 
        !data.candidates[0].content.parts[0].text) {
      throw new Error('Unexpected response format from Gemini API');
    }
    
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'AI call failed',
      error: error.message
    }));
    
    return `Error generating content: ${error.message}. Please try again later.`;
  }
}

// Improved handler for AI valuation requests
async function handleAIValuationRequest(req: Request): Promise<Response> {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
    'Content-Type': 'application/json',
  };
  
  try {
    // Get the authenticated user
    const authUser = getAuthUser(req);
    if (!authUser) {
      throw new Error('User authentication failed');
    }
    
    // Log request received
    console.log(JSON.stringify({
      level: 'info',
      message: 'AI valuation request received',
      userId: authUser.userId,
      method: req.method
    }));
    
    // Create Supabase client using service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse the request body
    const requestData: AIValuationRequest = await req.json();
    
    // Validate the request
    if (!requestData.appraisalId) {
      throw new Error('Appraisal ID is required');
    }
    
    if (!requestData.propertyDetails) {
      throw new Error('Property details are required');
    }
    
    // Verify user has access to this appraisal
    const { data: appraisal, error: appraisalError } = await supabase
      .from('appraisals')
      .select('id, user_id, team_id')
      .eq('id', requestData.appraisalId)
      .single();
    
    if (appraisalError || !appraisal) {
      throw new Error('Appraisal not found');
    }
    
    // Check user access permissions
    const isOwner = appraisal.user_id === authUser.userId;
    let isTeamMember = false;
    
    if (appraisal.team_id) {
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', appraisal.team_id)
        .eq('user_id', authUser.userId)
        .single();
      
      isTeamMember = !teamError && !!teamMember;
    }
    
    if (!isOwner && !isTeamMember) {
      throw new Error('Access denied. User does not have access to this appraisal');
    }
    
    // Initialize response data
    const responseData: {
      market_overview?: string;
      property_description?: string;
      comparable_analysis?: string;
    } = {};
    
    // Process generation requests in parallel
    const generateAll = requestData.requestType === 'all';
    const tasks: Promise<void>[] = [];
    
    if (generateAll || requestData.requestType === 'market_overview') {
      tasks.push(
        generateMarketOverview(
          requestData.propertyDetails,
          requestData.marketData,
          requestData.valuationData,
          requestData.options
        ).then(result => {
          responseData.market_overview = result;
        })
      );
    }
    
    if (generateAll || requestData.requestType === 'property_description') {
      tasks.push(
        generatePropertyDescription(
          requestData.propertyDetails,
          requestData.valuationData,
          requestData.options
        ).then(result => {
          responseData.property_description = result;
        })
      );
    }
    
    if (generateAll || requestData.requestType === 'comparable_analysis') {
      tasks.push(
        generateComparableAnalysis(
          requestData.propertyDetails,
          requestData.comparableProperties,
          requestData.valuationData,
          requestData.options
        ).then(result => {
          responseData.comparable_analysis = result;
        })
      );
    }
    
    // Wait for all content generation to complete
    await Promise.all(tasks);
    
    // Update the appraisal with generated content
    const updateData: Record<string, string | null> = {};
    
    if (responseData.market_overview) {
      updateData.ai_market_overview = responseData.market_overview;
    }
    
    if (responseData.property_description) {
      updateData.ai_property_description = responseData.property_description;
    }
    
    if (responseData.comparable_analysis) {
      updateData.ai_comparable_analysis_text = responseData.comparable_analysis;
    }
    
    // Update the appraisal record if we have new data
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('appraisals')
        .update(updateData)
        .eq('id', requestData.appraisalId);
      
      if (updateError) {
        console.error(JSON.stringify({
          level: 'error',
          message: 'Failed to update appraisal with AI content',
          error: updateError.message,
          appraisalId: requestData.appraisalId
        }));
      } else {
        console.log(JSON.stringify({
          level: 'info',
          message: 'Successfully updated appraisal with AI content',
          appraisalId: requestData.appraisalId,
          contentTypes: Object.keys(updateData).filter(k => k !== 'updated_at')
        }));
      }
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: responseData
      }),
      { 
        status: 200,
        headers
      }
    );
  } catch (error) {
    // Log the error
    console.error(JSON.stringify({
      level: 'error',
      message: 'Error processing AI Valuation request',
      error: error.message,
      stack: error.stack
    }));
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to generate AI content: ${error.message}`
      }),
      { 
        status: 400,
        headers
      }
    );
  }
}

// Set up the server with auth and CSRF protection
serve(
  withCsrfProtection(
    withAuth(handleAIValuationRequest, { 
      requireAuth: true
    }), 
    { enforceForMutations: true }
  )
); 