/**
 * Dynamic Prompt Generation System for AppraisalHub AI
 * 
 * This module provides utilities for generating dynamic prompts for AI models
 * based on contextual data, appraisal information, and specific use cases.
 */

// Base prompt templates for different use cases
export enum PromptTemplate {
  MARKET_ANALYSIS = 'market_analysis',
  PROPERTY_VALUATION = 'property_valuation',
  COMPARABLE_ANALYSIS = 'comparable_analysis',
  KEY_FEATURES = 'key_features',
  MARKET_TRENDS = 'market_trends',
  MARKETING_ADVICE = 'marketing_advice',
}

// Context information for prompts
export interface PromptContext {
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
  additionalContext?: Record<string, unknown>;
}

// Options for prompt generation
export interface PromptOptions {
  temperature?: number;
  detailLevel?: 'brief' | 'standard' | 'detailed';
  focusAreas?: string[];
  outputFormat?: 'text' | 'bullets' | 'json' | 'structured';
  maxTokens?: number;
  style?: 'professional' | 'friendly' | 'technical';
}

// AI response formats
export interface MarketAnalysisResponse {
  marketInsights: string;
  buyerDemand: string;
  futureTrends: string;
  keySellingPoints: string[];
  marketingStrategy: string;
}

export interface PropertyValuationResponse {
  valuationRange: {
    low: number | null;
    high: number | null;
  };
  keyFactors: string;
  featureImpacts: string;
  potentialImprovements: string[];
  confidenceAssessment: string;
}

export interface GenericResponse {
  content: string;
}

export type AIResponse = MarketAnalysisResponse | PropertyValuationResponse | GenericResponse;

/**
 * Generate a dynamic prompt for AI models based on the template, context, and options
 */
export function generatePrompt(
  template: PromptTemplate,
  context: PromptContext,
  options: PromptOptions = { 
    detailLevel: 'standard', 
    outputFormat: 'structured', 
    style: 'professional' 
  }
): string {
  // Logging for tracking prompt generation
  console.log(JSON.stringify({
    level: 'info',
    message: 'Generating dynamic prompt',
    template,
    contextKeys: Object.keys(context),
    options,
  }));

  // Format different sections of the prompt based on available data
  const propertyDescription = generatePropertyDescription(context);
  const marketContext = generateMarketContext(context);
  const focusAreas = options.focusAreas ? `Focus on these specific areas: ${options.focusAreas.join(', ')}.` : '';
  const outputInstructions = generateOutputInstructions(options);
  const styleGuidance = generateStyleGuidance(options.style || 'professional');

  // Select base template based on use case
  let basePrompt = '';
  switch (template) {
    case PromptTemplate.MARKET_ANALYSIS:
      basePrompt = generateMarketAnalysisPrompt(context, options);
      break;
    case PromptTemplate.PROPERTY_VALUATION:
      basePrompt = generatePropertyValuationPrompt(context, options);
      break;
    case PromptTemplate.COMPARABLE_ANALYSIS:
      basePrompt = generateComparableAnalysisPrompt(context, options);
      break;
    case PromptTemplate.KEY_FEATURES:
      basePrompt = generateKeyFeaturesPrompt(context, options);
      break;
    case PromptTemplate.MARKET_TRENDS:
      basePrompt = generateMarketTrendsPrompt(context, options);
      break;
    case PromptTemplate.MARKETING_ADVICE:
      basePrompt = generateMarketingAdvicePrompt(context, options);
      break;
    default:
      basePrompt = `Analyze this ${context.propertyType} in ${context.suburb}, ${context.city}.`;
  }

  // Assemble the complete prompt
  const completePrompt = `
${basePrompt}

${propertyDescription}

${marketContext}

${focusAreas}

${outputInstructions}

${styleGuidance}
  `.trim();

  // Log prompt length for monitoring
  console.log(JSON.stringify({
    level: 'info',
    message: 'Generated prompt',
    promptLength: completePrompt.length,
    promptFirstChars: completePrompt.substring(0, 100) + '...',
  }));

  return completePrompt;
}

/**
 * Generate a description of the property from context
 */
function generatePropertyDescription(context: PromptContext): string {
  const { propertyType, suburb, city, bedrooms, bathrooms, landSize, floorArea, yearBuilt, features } = context;
  
  let description = `Property details:\n- Type: ${propertyType}\n- Location: ${suburb}, ${city}`;
  
  if (bedrooms !== undefined) description += `\n- Bedrooms: ${bedrooms}`;
  if (bathrooms !== undefined) description += `\n- Bathrooms: ${bathrooms}`;
  if (landSize !== undefined) description += `\n- Land size: ${landSize} sqm`;
  if (floorArea !== undefined) description += `\n- Floor area: ${floorArea} sqm`;
  if (yearBuilt !== undefined) description += `\n- Year built: ${yearBuilt}`;
  
  if (features && features.length > 0) {
    description += `\n- Features: ${features.join(', ')}`;
  }
  
  return description;
}

/**
 * Generate market context based on recent sales and trends
 */
function generateMarketContext(context: PromptContext): string {
  const { recentSales, marketTrends } = context;
  
  let marketContext = '';
  
  if (recentSales && recentSales.length > 0) {
    marketContext += 'Recent sales in the area:\n';
    recentSales.forEach((sale, index) => {
      marketContext += `${index + 1}. $${sale.price.toLocaleString()} (${sale.date})`;
      if (sale.address) marketContext += ` - ${sale.address}`;
      if (sale.propertyType) marketContext += ` - ${sale.propertyType}`;
      if (sale.bedrooms && sale.bathrooms) marketContext += ` - ${sale.bedrooms}bed/${sale.bathrooms}bath`;
      marketContext += '\n';
    });
  }
  
  if (marketTrends) {
    marketContext += '\nMarket trends:\n';
    if (marketTrends.medianPrice !== undefined) marketContext += `- Median price: $${marketTrends.medianPrice.toLocaleString()}\n`;
    if (marketTrends.annualGrowth !== undefined) marketContext += `- Annual growth: ${marketTrends.annualGrowth}%\n`;
    if (marketTrends.salesVolume !== undefined) marketContext += `- Sales volume: ${marketTrends.salesVolume} properties\n`;
    if (marketTrends.daysOnMarket !== undefined) marketContext += `- Days on market: ${marketTrends.daysOnMarket} days\n`;
    if (marketTrends.demandScore !== undefined) marketContext += `- Demand score: ${marketTrends.demandScore}/10\n`;
  }
  
  return marketContext;
}

/**
 * Generate instructions for AI output format
 */
function generateOutputInstructions(options: PromptOptions): string {
  const detailLevel = options.detailLevel || 'standard';
  const outputFormat = options.outputFormat || 'structured';
  
  let instructions = `Please provide a ${detailLevel} analysis.`;
  
  switch (outputFormat) {
    case 'text':
      instructions += ' Format your response as flowing paragraphs of text.';
      break;
    case 'bullets':
      instructions += ' Format your response as bulleted lists with clear headers for each section.';
      break;
    case 'json':
      instructions += ' Format your entire response as a valid JSON object with appropriate nesting and structure.';
      break;
    case 'structured':
    default:
      instructions += ' Structure your response with clear section headings and a mix of paragraphs and bulleted lists as appropriate.';
  }
  
  if (options.maxTokens) {
    instructions += ` Keep your response concise, targeting approximately ${options.maxTokens} tokens.`;
  }
  
  return instructions;
}

/**
 * Generate guidance on the writing style for the AI
 */
function generateStyleGuidance(style: string): string {
  switch (style) {
    case 'professional':
      return 'Use a professional, authoritative tone appropriate for real estate professionals. Be precise and factual, while maintaining clarity.';
    case 'friendly':
      return 'Use a friendly, approachable tone that would be comfortable for homeowners to read. Avoid overly technical jargon.';
    case 'technical':
      return 'Use a technical, data-focused tone with precise terminology. Include relevant metrics and quantitative analysis where possible.';
    default:
      return 'Maintain a balanced, professional tone throughout your response.';
  }
}

/**
 * Generate market analysis specific prompt
 */
function generateMarketAnalysisPrompt(context: PromptContext, options: PromptOptions): string {
  return `
As a real estate market analysis expert, provide a detailed market analysis for a ${context.propertyType} in ${context.suburb}, ${context.city}.

Your analysis should include:
1. Current market conditions for this property type in this location
2. Buyer demand analysis
3. Future market projections (next 2-3 years)
4. Key selling points based on market conditions
5. Recommended marketing strategy
  `.trim();
}

/**
 * Generate property valuation specific prompt
 */
function generatePropertyValuationPrompt(context: PromptContext, options: PromptOptions): string {
  return `
As a property valuation expert, provide a valuation analysis for a ${context.propertyType} in ${context.suburb}, ${context.city}.

Your analysis should include:
1. Estimated value range based on comparable properties
2. Key factors influencing the valuation
3. Explanation of how each property feature impacts value
4. Potential improvements that could increase value
5. Confidence assessment of the valuation
  `.trim();
}

/**
 * Generate comparable analysis specific prompt
 */
function generateComparableAnalysisPrompt(context: PromptContext, options: PromptOptions): string {
  return `
As a property comparison expert, analyze how this ${context.propertyType} in ${context.suburb}, ${context.city} compares to recent sales.

Your analysis should include:
1. How this property compares to recent sales in terms of features and quality
2. Adjustments that should be made when comparing to each sale
3. Which comparable properties are most relevant and why
4. How unique features of this property affect its comparative value
  `.trim();
}

/**
 * Generate key features specific prompt
 */
function generateKeyFeaturesPrompt(context: PromptContext, options: PromptOptions): string {
  return `
Identify and describe the most marketable features of this ${context.propertyType} in ${context.suburb}, ${context.city}.

Your response should include:
1. The top 5 most valuable features of this property
2. Why each feature adds value in the current market
3. How these features compare to typical properties in this area
4. Suggestions for highlighting these features when marketing the property
  `.trim();
}

/**
 * Generate market trends specific prompt
 */
function generateMarketTrendsPrompt(context: PromptContext, options: PromptOptions): string {
  return `
Analyze current and future market trends for ${context.propertyType} properties in ${context.suburb}, ${context.city}.

Your analysis should include:
1. Key market indicators and their current values
2. How these indicators have changed over the past 12-24 months
3. Projected trends for the next 1-3 years
4. How these trends specifically impact this property type
5. Recommendations based on these trends
  `.trim();
}

/**
 * Generate marketing advice specific prompt
 */
function generateMarketingAdvicePrompt(context: PromptContext, options: PromptOptions): string {
  return `
Provide strategic marketing advice for selling this ${context.propertyType} in ${context.suburb}, ${context.city}.

Your advice should include:
1. Recommended target buyer demographics
2. Optimal marketing channels for reaching these buyers
3. Key messaging points to emphasize
4. Timing recommendations for the market
5. Suggested presentation/staging to maximize appeal
  `.trim();
}

/**
 * Format the AI response according to the required structure
 */
export function formatAIResponse(
  rawResponse: string, 
  template: PromptTemplate,
  outputFormat: 'text' | 'bullets' | 'json' | 'structured' = 'structured'
): any {
  if (outputFormat === 'json') {
    try {
      // Attempt to parse as JSON
      return JSON.parse(rawResponse);
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Failed to parse AI response as JSON',
        error: error.message,
        rawResponse: rawResponse.substring(0, 200) + '...',
      }));
      
      // Fall back to text format
      return { content: rawResponse };
    }
  }
  
  // For other formats, return structured text based on the template
  switch (template) {
    case PromptTemplate.MARKET_ANALYSIS:
      return structureMarketAnalysis(rawResponse);
    case PromptTemplate.PROPERTY_VALUATION:
      return structurePropertyValuation(rawResponse);
    default:
      // For other templates, return the raw text
      return { content: rawResponse };
  }
}

/**
 * Structure market analysis response
 */
function structureMarketAnalysis(text: string): any {
  // Extract sections using regex
  const marketInsights = extractSection(text, 'market conditions|market insights', 'buyer demand');
  const buyerDemand = extractSection(text, 'buyer demand', 'future|projections');
  const futureTrends = extractSection(text, 'future|projections', 'key selling points');
  const keySellingPoints = extractBulletPoints(extractSection(text, 'key selling points', 'marketing strategy'));
  const marketingStrategy = extractSection(text, 'marketing strategy', null);
  
  return {
    marketInsights: marketInsights || 'No market insights available',
    buyerDemand: buyerDemand || 'No buyer demand analysis available',
    futureTrends: futureTrends || 'No future trends available',
    keySellingPoints: keySellingPoints.length > 0 ? keySellingPoints : ['No key selling points available'],
    marketingStrategy: marketingStrategy || 'No marketing strategy available',
  };
}

/**
 * Structure property valuation response
 */
function structurePropertyValuation(text: string): any {
  // Extract valuation range using regex
  const valueRangeMatch = text.match(/\$([0-9,.]+)\s*-\s*\$([0-9,.]+)/);
  const valuationLow = valueRangeMatch ? parseFloat(valueRangeMatch[1].replace(/,/g, '')) : null;
  const valuationHigh = valueRangeMatch ? parseFloat(valueRangeMatch[2].replace(/,/g, '')) : null;
  
  // Extract other sections
  const keyFactors = extractSection(text, 'key factors', 'feature impacts|explanation');
  const featureImpacts = extractSection(text, 'feature impacts|explanation of', 'potential improvements');
  const potentialImprovements = extractBulletPoints(extractSection(text, 'potential improvements', 'confidence'));
  const confidenceAssessment = extractSection(text, 'confidence assessment', null);
  
  return {
    valuationRange: {
      low: valuationLow,
      high: valuationHigh,
    },
    keyFactors: keyFactors || 'No key factors available',
    featureImpacts: featureImpacts || 'No feature impact analysis available',
    potentialImprovements: potentialImprovements.length > 0 ? potentialImprovements : ['No potential improvements available'],
    confidenceAssessment: confidenceAssessment || 'No confidence assessment available',
  };
}

/**
 * Extract a section from text using regex
 */
function extractSection(text: string, sectionTitle: string, nextSectionTitle: string | null): string | null {
  const sectionRegex = new RegExp(
    `(?:${sectionTitle}).*?[:\n](.*?)${nextSectionTitle ? `(?:${nextSectionTitle})` : '$'}`, 
    'is'
  );
  
  const match = text.match(sectionRegex);
  return match ? match[1].trim() : null;
}

/**
 * Extract bullet points from text
 */
function extractBulletPoints(text: string | null): string[] {
  if (!text) return [];
  
  return text
    .split('\n')
    .filter(line => line.trim().match(/^[-•*]|\d+\./))
    .map(line => line.replace(/^[-•*]\s*|\d+\.\s*/, '').trim())
    .filter(line => line.length > 0);
} 