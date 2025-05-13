import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { 
  generatePrompt, 
  PromptTemplate, 
  PromptContext, 
  PromptOptions, 
  formatAIResponse,
  MarketAnalysisResponse
} from '../utils/prompt-generator.ts';

interface MarketAnalysisRequest {
  appraisalId: string;
  propertyType: string;
  suburb: string;
  city: string;
  bedrooms?: number;
  bathrooms?: number;
  landSize?: number;
  floorArea?: number;
  yearBuilt?: number;
  features?: string[];
  recentSales?: Array<{
    price: number;
    date: string;
    address?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
  }>;
  marketTrends?: {
    medianPrice?: number;
    annualGrowth?: number;
    salesVolume?: number;
    daysOnMarket?: number;
    demandScore?: number;
  };
  promptOptions?: PromptOptions;
}

interface ApiResponse {
  success: boolean;
  error?: string;
  data?: MarketAnalysisResponse;
}

// Generate market analysis using Google Vertex AI/Gemini API
async function generateMarketAnalysis(request: MarketAnalysisRequest): Promise<ApiResponse> {
  // Log the request details
  console.log(JSON.stringify({
    level: 'info',
    message: 'Generating AI market analysis using Google Vertex AI/Gemini',
    request: {
      appraisalId: request.appraisalId,
      propertyType: request.propertyType,
      suburb: request.suburb,
      city: request.city,
      promptOptions: request.promptOptions,
    },
  }));
  
  try {
    // Get API key from environment variables, with fallback to the provided key
    const apiKey = Deno.env.get('GOOGLE_VERTEX_API_KEY') || 'AIzaSyCg9azKXqr590cVrV7K3uRKGQMcGl6U-Ec';
    
    // Setup the prompt context
    const promptContext: PromptContext = {
      propertyType: request.propertyType,
      suburb: request.suburb,
      city: request.city,
      bedrooms: request.bedrooms,
      bathrooms: request.bathrooms,
      landSize: request.landSize,
      floorArea: request.floorArea,
      yearBuilt: request.yearBuilt,
      features: request.features,
      recentSales: request.recentSales,
      marketTrends: request.marketTrends,
    };
    
    // Setup prompt options
    const promptOptions: PromptOptions = request.promptOptions || {
      detailLevel: 'detailed',
      outputFormat: 'structured',
      style: 'professional',
    };
    
    // Generate the prompt using the dynamic prompt generator
    const prompt = generatePrompt(
      PromptTemplate.MARKET_ANALYSIS,
      promptContext,
      promptOptions
    );
    
    console.log(JSON.stringify({
      level: 'info',
      message: 'Sending request to Google Vertex AI/Gemini',
      promptLength: prompt.length,
    }));
    
    // Call the Gemini API
    const geminiResponse = await fetch(
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
            temperature: promptOptions.temperature || 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: promptOptions.maxTokens || 1024,
          }
        }),
      }
    );
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorData}`);
    }
    
    const geminiData = await geminiResponse.json();
    
    // Log successful Gemini response
    console.log(JSON.stringify({
      level: 'info',
      message: 'Received response from Google Vertex AI/Gemini',
      responseStatus: geminiResponse.status,
    }));
    
    // Get the response text
    const rawResponseText = geminiData.candidates[0].content.parts[0].text;
    
    // Format the response using our response formatter
    const formattedResponse = formatAIResponse(
      rawResponseText,
      PromptTemplate.MARKET_ANALYSIS,
      promptOptions.outputFormat
    ) as MarketAnalysisResponse;
    
    // Assemble the final response
    const response: ApiResponse = {
      success: true,
      data: formattedResponse,
    };
    
    return response;
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Error generating market analysis with Gemini',
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
      throw new Error('Invalid token or user not found');
    }
    
    // Log authenticated user
    console.log(JSON.stringify({
      level: 'info',
      message: 'Authenticated user',
      userId: user.id,
    }));
    
    // Check if user has access to the appraisal
    const { data: appraisal, error: appraisalError } = await supabaseClient
      .from('appraisals')
      .select('id, user_id, team_id')
      .eq('id', requestData.appraisalId)
      .single();
    
    if (appraisalError || !appraisal) {
      throw new Error('Appraisal not found');
    }
    
    // Check if user owns the appraisal or is in the team
    const isOwner = appraisal.user_id === user.id;
    let isTeamMember = false;
    
    if (appraisal.team_id) {
      const { data: teamMember, error: teamError } = await supabaseClient
        .from('team_members')
        .select('id')
        .eq('team_id', appraisal.team_id)
        .eq('user_id', user.id)
        .single();
      
      isTeamMember = !teamError && !!teamMember;
    }
    
    if (!isOwner && !isTeamMember) {
      throw new Error('Access denied. User does not have access to this appraisal');
    }
    
    // Generate AI market analysis
    const analysisResult = await generateMarketAnalysis(requestData);
    
    // If successful, update the appraisal with the analysis results
    if (analysisResult.success && analysisResult.data) {
      const updateData = {
        ai_content: {
          ...appraisal.ai_content,
          marketAnalysis: analysisResult.data
        },
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabaseClient
        .from('appraisals')
        .update(updateData)
        .eq('id', requestData.appraisalId);
      
      if (updateError) {
        console.error(JSON.stringify({
          level: 'error',
          message: 'Failed to update appraisal with analysis results',
          error: updateError.message,
        }));
      } else {
        console.log(JSON.stringify({
          level: 'info',
          message: 'Updated appraisal with analysis results',
          appraisalId: requestData.appraisalId,
        }));
      }
    }
    
    // Return the analysis result
    return new Response(
      JSON.stringify(analysisResult),
      { headers }
    );
    
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Error processing request',
      error: error.message,
    }));
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 400, headers }
    );
  }
}); 