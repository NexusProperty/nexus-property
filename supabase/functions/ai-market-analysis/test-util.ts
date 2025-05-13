// Test utility for the ai-market-analysis function
// This file contains an exported version of the generateMarketAnalysis function

export interface MarketAnalysisRequest {
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

export interface MarketAnalysisResponse {
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

// Real implementation of AI market analysis using Google Vertex AI/Gemini API
export async function generateMarketAnalysis(request: MarketAnalysisRequest): Promise<MarketAnalysisResponse> {
  // Log the request details
  console.log(JSON.stringify({
    level: 'info',
    message: 'Generating AI market analysis using Google Vertex AI/Gemini',
    request,
  }));
  
  try {
    // Get API key from environment variables, with fallback to the provided key
    const apiKey = Deno.env.get('GOOGLE_VERTEX_API_KEY') || 'AIzaSyCg9azKXqr590cVrV7K3uRKGQMcGl6U-Ec';
    
    // Format recent sales data for the prompt
    const recentSalesText = request.recentSales?.length 
      ? `Recent sales in the area:\n${request.recentSales.map(sale => 
          `- $${sale.price.toLocaleString()} (${sale.date})`).join('\n')}`
      : 'No recent sales data available.';
    
    // Format market trends for the prompt
    const marketTrendsText = request.marketTrends 
      ? `Current market trends:\n` +
        `- Median Price: $${request.marketTrends.medianPrice.toLocaleString()}\n` +
        `- Annual Growth: ${request.marketTrends.annualGrowth}%\n` +
        `- Sales Volume: ${request.marketTrends.salesVolume} properties\n` +
        `- Days on Market: ${request.marketTrends.daysOnMarket} days`
      : 'No market trends data available.';
    
    // Build the prompt for Gemini
    const prompt = `
    As a real estate market analysis expert, provide a detailed market analysis for a ${request.propertyType} in ${request.suburb}, ${request.city}.
    
    ${recentSalesText}
    
    ${marketTrendsText}
    
    Please provide the analysis in the following structured format:
    1. Market Insights: A detailed analysis of the current market conditions for this property type in this location.
    2. Buyer Demand Analysis: An analysis of current buyer behavior, preferences, and demand for this property type in this location.
    3. Future Trends: Projections and forecasts for this market over the next 2-3 years.
    4. Key Selling Points: List exactly five key selling points for this property based on the market conditions (return as a list).
    5. Recommended Marketing Strategy: A specific strategy for marketing this property in the current market.
    
    For each section, provide detailed and specific information relevant to this ${request.propertyType} in ${request.suburb}, ${request.city}.
    Don't use placeholder or generic information - base your analysis on the data provided.
    `;
    
    console.log(JSON.stringify({
      level: 'info',
      message: 'Sending request to Google Vertex AI/Gemini',
      prompt: prompt.substring(0, 100) + '...',
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
            temperature: 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1024,
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
    
    // Process the response text
    const fullResponseText = geminiData.candidates[0].content.parts[0].text;
    
    // Extract sections using regex
    const marketInsights = extractSection(fullResponseText, 'Market Insights', 'Buyer Demand Analysis') || 
      'Market insights data not available';
      
    const buyerDemandAnalysis = extractSection(fullResponseText, 'Buyer Demand Analysis', 'Future Trends') || 
      'Buyer demand analysis not available';
      
    const futureTrends = extractSection(fullResponseText, 'Future Trends', 'Key Selling Points') || 
      'Future trends data not available';
    
    // Extract key selling points as an array
    const keySellingPointsText = extractSection(fullResponseText, 'Key Selling Points', 'Recommended Marketing Strategy');
    const keySellingPoints = keySellingPointsText ? 
      keySellingPointsText.split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
        .map(line => line.replace(/^-\s*|^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0) : 
      ['No key selling points available'];
    
    // Ensure exactly 5 key selling points - either trim excess or add generic ones
    const finalKeySellingPoints = keySellingPoints.length >= 5 ? 
      keySellingPoints.slice(0, 5) : 
      [
        ...keySellingPoints,
        ...Array(5 - keySellingPoints.length).fill('').map((_, i) => 
          `Strong investment potential in ${request.suburb}`)
      ];
    
    const recommendedMarketingStrategy = extractSection(fullResponseText, 'Recommended Marketing Strategy', null) || 
      'Recommended marketing strategy not available';
    
    // Assemble the response
    const response: MarketAnalysisResponse = {
      success: true,
      data: {
        marketInsights: marketInsights.trim(),
        buyerDemandAnalysis: buyerDemandAnalysis.trim(),
        futureTrends: futureTrends.trim(),
        keySellingPoints: finalKeySellingPoints,
        recommendedMarketingStrategy: recommendedMarketingStrategy.trim(),
      },
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

// Helper function to extract sections from the AI response
function extractSection(text: string, sectionTitle: string, nextSectionTitle: string | null): string | null {
  const sectionRegex = new RegExp(
    `${sectionTitle}:?\\s*([\\s\\S]+?)${nextSectionTitle ? `(?=${nextSectionTitle}:?)` : '$'}`, 
    'i'
  );
  
  const match = text.match(sectionRegex);
  return match ? match[1].trim() : null;
} 