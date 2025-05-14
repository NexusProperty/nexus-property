import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { withCsrfProtection } from '../utils/csrf-middleware.ts';

// Get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error(JSON.stringify({
    level: 'error',
    message: 'Missing required environment variables',
    missingUrl: !supabaseUrl,
    missingServiceKey: !supabaseServiceKey
  }));
}

// Types for the request and response
interface ValuationRequest {
  appraisalId: string;
  propertyDetails: PropertyDetails;
  comparableProperties: ComparableProperty[];
}

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
  similarityScore: number;
  distanceKm?: number;
}

interface ValuationResult {
  success: boolean;
  error?: string;
  data?: {
    valuationLow: number;
    valuationHigh: number;
    valuationConfidence: number; // 0 to 1
    adjustedComparables: Array<{
      id: string;
      address: string;
      salePrice: number;
      adjustedPrice: number;
      adjustmentFactor: number;
      weight: number;
      isOutlier: boolean;
    }>;
    valuationFactors: {
      bedroomValue?: number;
      bathroomValue?: number;
      landSizeValue?: number;
      floorAreaValue?: number;
      locationFactor?: number;
      ageAdjustment?: number;
    };
    marketTrends: {
      medianPrice: number;
      pricePerSqm: number;
      annualGrowth: number;
    };
  };
}

// Authentication middleware function
async function authenticateRequest(req: Request): Promise<{ 
  authenticated: boolean; 
  userId?: string; 
  error?: string;
}> {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return { 
        authenticated: false, 
        error: 'Missing Authorization header' 
      };
    }
    
    // Format should be "Bearer JWT_TOKEN"
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return { 
        authenticated: false, 
        error: 'Invalid Authorization format' 
      };
    }
    
    // Create a Supabase client with the anon key
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Verify the JWT
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { 
        authenticated: false, 
        error: error?.message || 'Authentication failed' 
      };
    }
    
    return { 
      authenticated: true, 
      userId: user.id 
    };
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Authentication error',
      error: error.message
    }));
    
    return { 
      authenticated: false, 
      error: `Authentication error: ${error.message}` 
    };
  }
}

// Main valuation function
async function calculateValuation(request: ValuationRequest): Promise<ValuationResult> {
  // Log processing start
  console.log(JSON.stringify({
    level: 'info',
    message: 'Processing valuation request',
    appraisalId: request.appraisalId,
    comparableCount: request.comparableProperties.length
  }));

  try {
    // 1. Validate input data
    if (!request.propertyDetails) {
      throw new Error('Property details are required');
    }

    if (!request.comparableProperties || request.comparableProperties.length === 0) {
      throw new Error('At least one comparable property is required');
    }

    // Filter out comparables without sale prices
    const validComparables = request.comparableProperties.filter(comp => 
      comp.salePrice !== null && comp.salePrice !== undefined && comp.salePrice > 0
    );

    if (validComparables.length === 0) {
      throw new Error('No valid comparable properties with sale prices');
    }

    // 2. Detect and handle outliers using IQR method
    const { filteredComparables, outliers } = detectOutliers(validComparables);
    
    if (filteredComparables.length < 2) {
      throw new Error('Not enough valid comparable properties after outlier detection');
    }

    // 3. Calculate adjusted prices for each comparable
    const adjustedComparables = calculateAdjustedPrices(
      filteredComparables, 
      request.propertyDetails,
      outliers
    );

    // 4. Apply weights based on similarity, recency, and distance
    const weightedComparables = applyWeights(adjustedComparables);
    
    // 5. Calculate final valuation
    const valuation = calculateFinalValuation(weightedComparables, request.propertyDetails);
    
    // 6. Calculate confidence score
    const confidenceScore = calculateConfidenceScore(
      weightedComparables,
      request.propertyDetails,
      outliers.length
    );

    // 7. Calculate market trends
    const marketTrends = calculateMarketTrends(weightedComparables);

    // 8. Format and return result
    return {
      success: true,
      data: {
        valuationLow: Math.round(valuation.low),
        valuationHigh: Math.round(valuation.high),
        valuationConfidence: confidenceScore,
        adjustedComparables: weightedComparables.map(comp => ({
          id: comp.id,
          address: comp.address,
          salePrice: comp.salePrice!,
          adjustedPrice: comp.adjustedPrice!,
          adjustmentFactor: comp.adjustmentFactor!,
          weight: comp.weight!,
          isOutlier: comp.isOutlier || false
        })),
        valuationFactors: valuation.factors,
        marketTrends
      }
    };
  } catch (error) {
    // Log error
    console.error(JSON.stringify({
      level: 'error',
      message: 'Valuation calculation error',
      error: error.message
    }));
    
    return {
      success: false,
      error: `Failed to calculate valuation: ${error.message}`
    };
  }
}

// Helper function to detect outliers using Interquartile Range (IQR) method
function detectOutliers(comparables: ComparableProperty[]): { 
  filteredComparables: ComparableProperty[], 
  outliers: ComparableProperty[] 
} {
  // Sort by sale price
  const sortedPrices = [...comparables]
    .filter(comp => comp.salePrice !== null && comp.salePrice !== undefined)
    .map(comp => comp.salePrice!)
    .sort((a, b) => a - b);
  
  // Calculate quartiles
  const q1Index = Math.floor(sortedPrices.length * 0.25);
  const q3Index = Math.floor(sortedPrices.length * 0.75);
  const q1 = sortedPrices[q1Index];
  const q3 = sortedPrices[q3Index];
  
  // Calculate IQR and bounds
  const iqr = q3 - q1;
  const lowerBound = q1 - (iqr * 1.5);
  const upperBound = q3 + (iqr * 1.5);
  
  // Identify outliers but keep them with a flag
  const filteredComparables = comparables.map(comp => {
    if (comp.salePrice! < lowerBound || comp.salePrice! > upperBound) {
      return { ...comp, isOutlier: true };
    }
    return { ...comp, isOutlier: false };
  });
  
  const outliers = filteredComparables.filter(comp => comp.isOutlier);
  
  return { 
    filteredComparables, 
    outliers 
  };
}

// Helper function to calculate adjusted prices
function calculateAdjustedPrices(
  comparables: ComparableProperty[], 
  propertyDetails: PropertyDetails,
  outliers: ComparableProperty[]
): Array<ComparableProperty & { 
  adjustedPrice?: number, 
  adjustmentFactor?: number,
  isOutlier?: boolean
}> {
  return comparables.map(comp => {
    let adjustmentFactor = 1.0;
    
    // Adjust for bedrooms difference
    if (comp.bedrooms !== undefined && propertyDetails.bedrooms !== undefined) {
      const bedroomDiff = propertyDetails.bedrooms - comp.bedrooms;
      const bedroomAdjustment = bedroomDiff * 0.05; // 5% per bedroom
      adjustmentFactor += bedroomAdjustment;
    }
    
    // Adjust for bathrooms difference
    if (comp.bathrooms !== undefined && propertyDetails.bathrooms !== undefined) {
      const bathroomDiff = propertyDetails.bathrooms - comp.bathrooms;
      const bathroomAdjustment = bathroomDiff * 0.03; // 3% per bathroom
      adjustmentFactor += bathroomAdjustment;
    }
    
    // Adjust for land size difference
    if (comp.landSize !== undefined && propertyDetails.landSize !== undefined && comp.landSize > 0) {
      const landSizeDiff = (propertyDetails.landSize / comp.landSize) - 1;
      const landSizeAdjustment = landSizeDiff * 0.1; // 10% factor for land size ratio
      adjustmentFactor += landSizeAdjustment;
    }
    
    // Adjust for floor area difference
    if (comp.floorArea !== undefined && propertyDetails.floorArea !== undefined && comp.floorArea > 0) {
      const floorAreaDiff = (propertyDetails.floorArea / comp.floorArea) - 1;
      const floorAreaAdjustment = floorAreaDiff * 0.15; // 15% factor for floor area ratio
      adjustmentFactor += floorAreaAdjustment;
    }
    
    // Adjust for age/year built
    if (comp.yearBuilt !== undefined && propertyDetails.yearBuilt !== undefined) {
      const ageDiff = propertyDetails.yearBuilt - comp.yearBuilt;
      const ageAdjustment = ageDiff * 0.005; // 0.5% per year
      adjustmentFactor += ageAdjustment;
    }
    
    // Adjust for property type
    if (comp.propertyType !== propertyDetails.propertyType) {
      adjustmentFactor *= 0.9; // 10% reduction for different property type
    }
    
    // Adjust for recency of sale
    if (comp.saleDate) {
      const saleDate = new Date(comp.saleDate);
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - saleDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - saleDate.getMonth());
      
      // Apply market growth adjustment (estimated at 0.5% per month)
      const growthAdjustment = monthsDiff * 0.005;
      adjustmentFactor += growthAdjustment;
    }
    
    // Calculate adjusted price
    const adjustedPrice = comp.salePrice! * adjustmentFactor;
    
    // Check if this is an outlier
    const isOutlier = outliers.some(outlier => outlier.id === comp.id);
    
    return {
      ...comp,
      adjustedPrice,
      adjustmentFactor,
      isOutlier
    };
  });
}

// Helper function to apply weights based on similarity, recency, and distance
function applyWeights(comparables: Array<ComparableProperty & { 
  adjustedPrice?: number, 
  adjustmentFactor?: number,
  isOutlier?: boolean
}>): Array<ComparableProperty & { 
  adjustedPrice?: number, 
  adjustmentFactor?: number,
  weight?: number,
  isOutlier?: boolean
}> {
  // Apply weights based on similarity score (40%), recency (30%), and distance (30%)
  return comparables.map(comp => {
    let weight = 0;
    
    // Similarity score weight (40%)
    const similarityWeight = (comp.similarityScore / 100) * 0.4;
    weight += similarityWeight;
    
    // Recency weight (30%)
    if (comp.saleDate) {
      const saleDate = new Date(comp.saleDate);
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - saleDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - saleDate.getMonth());
      
      // More recent sales get higher weight
      const maxMonths = 36; // Consider sales up to 3 years old
      const recencyWeight = (1 - Math.min(monthsDiff, maxMonths) / maxMonths) * 0.3;
      weight += recencyWeight;
    } else {
      // If no sale date, assign average recency weight
      weight += 0.15;
    }
    
    // Distance weight (30%)
    if (comp.distanceKm !== undefined) {
      const maxDistance = 10; // km
      const distanceWeight = (1 - Math.min(comp.distanceKm, maxDistance) / maxDistance) * 0.3;
      weight += distanceWeight;
    } else {
      // If no distance provided, assign average distance weight
      weight += 0.15;
    }
    
    // If this is an outlier, reduce the weight
    if (comp.isOutlier) {
      weight *= 0.3; // Reduce to 30% of original weight
    }
    
    return {
      ...comp,
      weight
    };
  });
}

// Helper function to calculate the final valuation
function calculateFinalValuation(
  weightedComparables: Array<ComparableProperty & { 
    adjustedPrice?: number, 
    adjustmentFactor?: number,
    weight?: number,
    isOutlier?: boolean
  }>,
  propertyDetails: PropertyDetails
): { 
  low: number; 
  high: number; 
  factors: {
    bedroomValue?: number;
    bathroomValue?: number;
    landSizeValue?: number;
    floorAreaValue?: number;
    locationFactor?: number;
    ageAdjustment?: number;
  };
} {
  // Calculate weighted median
  const totalWeight = weightedComparables.reduce((sum, comp) => sum + comp.weight!, 0);
  const normalizedComparables = weightedComparables.map(comp => ({
    ...comp,
    normalizedWeight: comp.weight! / totalWeight
  }));
  
  // Sort by adjusted price
  normalizedComparables.sort((a, b) => a.adjustedPrice! - b.adjustedPrice!);
  
  // Calculate weighted median
  let cumulativeWeight = 0;
  let medianPrice = 0;
  
  for (const comp of normalizedComparables) {
    cumulativeWeight += comp.normalizedWeight;
    if (cumulativeWeight >= 0.5) {
      medianPrice = comp.adjustedPrice!;
      break;
    }
  }
  
  // Calculate weighted mean
  const weightedSum = normalizedComparables.reduce(
    (sum, comp) => sum + comp.adjustedPrice! * comp.normalizedWeight, 
    0
  );
  
  // Calculate standard deviation
  const variance = normalizedComparables.reduce(
    (sum, comp) => sum + Math.pow(comp.adjustedPrice! - weightedSum, 2) * comp.normalizedWeight,
    0
  );
  const standardDeviation = Math.sqrt(variance);
  
  // Calculate confidence-based range
  // For higher confidence, use narrower range
  const baseRangePercentage = 0.05; // Minimum 5% range
  
  // Calculate valuation factors for explanation
  const factors: {
    bedroomValue?: number;
    bathroomValue?: number;
    landSizeValue?: number;
    floorAreaValue?: number;
    locationFactor?: number;
    ageAdjustment?: number;
  } = {};
  
  // Estimate per-bedroom value
  if (propertyDetails.bedrooms) {
    const bedroomComps = normalizedComparables.filter(
      comp => comp.bedrooms !== undefined && comp.bedrooms > 0
    );
    if (bedroomComps.length > 0) {
      factors.bedroomValue = Math.round(
        bedroomComps.reduce((sum, comp) => 
          sum + (comp.adjustedPrice! / comp.bedrooms!) * comp.normalizedWeight, 
          0
        ) / bedroomComps.reduce((sum, comp) => sum + comp.normalizedWeight, 0)
      );
    }
  }
  
  // Estimate per-sqm land value
  if (propertyDetails.landSize && propertyDetails.landSize > 0) {
    const landComps = normalizedComparables.filter(
      comp => comp.landSize !== undefined && comp.landSize > 0
    );
    if (landComps.length > 0) {
      factors.landSizeValue = Math.round(
        landComps.reduce((sum, comp) => 
          sum + (comp.adjustedPrice! / comp.landSize!) * comp.normalizedWeight, 
          0
        ) / landComps.reduce((sum, comp) => sum + comp.normalizedWeight, 0)
      );
    }
  }
  
  // Estimate per-sqm floor area value
  if (propertyDetails.floorArea && propertyDetails.floorArea > 0) {
    const floorAreaComps = normalizedComparables.filter(
      comp => comp.floorArea !== undefined && comp.floorArea > 0
    );
    if (floorAreaComps.length > 0) {
      factors.floorAreaValue = Math.round(
        floorAreaComps.reduce((sum, comp) => 
          sum + (comp.adjustedPrice! / comp.floorArea!) * comp.normalizedWeight, 
          0
        ) / floorAreaComps.reduce((sum, comp) => sum + comp.normalizedWeight, 0)
      );
    }
  }
  
  // Use both median and mean with more weight to median for stability
  const baseValuation = medianPrice * 0.7 + weightedSum * 0.3;
  
  // Use standard deviation to influence range width
  // Higher standard deviation = wider range
  const coefficientOfVariation = standardDeviation / weightedSum;
  const rangePercentage = Math.max(baseRangePercentage, coefficientOfVariation);
  
  // Calculate low and high values with at least 5% range
  const low = baseValuation * (1 - rangePercentage);
  const high = baseValuation * (1 + rangePercentage);
  
  return { low, high, factors };
}

// Helper function to calculate confidence score
function calculateConfidenceScore(
  weightedComparables: Array<ComparableProperty & { 
    adjustedPrice?: number, 
    weight?: number,
    isOutlier?: boolean
  }>,
  propertyDetails: PropertyDetails,
  outlierCount: number
): number {
  // Start with base confidence
  let confidence = 0.7;
  
  // Factor 1: Number of comparables (more is better)
  const comparableCountFactor = Math.min(weightedComparables.length / 10, 1) * 0.1;
  confidence += comparableCountFactor;
  
  // Factor 2: Average similarity score (higher is better)
  const avgSimilarity = weightedComparables.reduce((sum, comp) => sum + comp.similarityScore, 0) / 
                        weightedComparables.length;
  const similarityFactor = (avgSimilarity / 100) * 0.1;
  confidence += similarityFactor;
  
  // Factor 3: Consistency of prices (lower coefficient of variation is better)
  const mean = weightedComparables.reduce((sum, comp) => sum + comp.adjustedPrice!, 0) / 
               weightedComparables.length;
  const variance = weightedComparables.reduce(
    (sum, comp) => sum + Math.pow(comp.adjustedPrice! - mean, 2), 
    0
  ) / weightedComparables.length;
  const stdDev = Math.sqrt(variance);
  const cov = stdDev / mean;
  const consistencyFactor = Math.max(0, 0.1 - (cov * 0.5));
  confidence += consistencyFactor;
  
  // Factor 4: Data recency (newer data is better)
  let recencyFactor = 0;
  const compsWithDates = weightedComparables.filter(comp => comp.saleDate);
  if (compsWithDates.length > 0) {
    const avgMonthsOld = compsWithDates.reduce((sum, comp) => {
      const saleDate = new Date(comp.saleDate!);
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - saleDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - saleDate.getMonth());
      return sum + monthsDiff;
    }, 0) / compsWithDates.length;
    
    // More recent = higher confidence
    recencyFactor = Math.max(0, 0.1 - (avgMonthsOld / 36) * 0.1);
    confidence += recencyFactor;
  }
  
  // Factor 5: Outlier penalty
  const outlierPenalty = outlierCount > 0 ? Math.min(outlierCount / weightedComparables.length, 0.2) : 0;
  confidence -= outlierPenalty;
  
  // Factor 6: Property type match bonus
  const typeMatchCount = weightedComparables.filter(
    comp => comp.propertyType === propertyDetails.propertyType
  ).length;
  const typeMatchFactor = (typeMatchCount / weightedComparables.length) * 0.05;
  confidence += typeMatchFactor;
  
  // Ensure confidence is between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}

// Helper function to calculate market trends
function calculateMarketTrends(comparables: Array<ComparableProperty & { 
  adjustedPrice?: number 
}>): {
  medianPrice: number;
  pricePerSqm: number;
  annualGrowth: number;
} {
  // Calculate median price
  const sortedPrices = [...comparables]
    .map(comp => comp.adjustedPrice!)
    .sort((a, b) => a - b);
  const medianIndex = Math.floor(sortedPrices.length / 2);
  const medianPrice = sortedPrices.length % 2 === 0
    ? (sortedPrices[medianIndex - 1] + sortedPrices[medianIndex]) / 2
    : sortedPrices[medianIndex];
  
  // Calculate price per square meter
  const compsWithFloorArea = comparables.filter(
    comp => comp.floorArea !== undefined && comp.floorArea > 0
  );
  let pricePerSqm = 0;
  
  if (compsWithFloorArea.length > 0) {
    pricePerSqm = compsWithFloorArea.reduce(
      (sum, comp) => sum + comp.adjustedPrice! / comp.floorArea!,
      0
    ) / compsWithFloorArea.length;
  } else {
    // Fallback if no floor area data
    pricePerSqm = medianPrice / 100; // Rough estimate
  }
  
  // Estimate annual growth rate
  // This would ideally use time series analysis
  // Simplified example: use 5% as default annual growth
  const annualGrowth = 0.05;
  
  return {
    medianPrice: Math.round(medianPrice),
    pricePerSqm: Math.round(pricePerSqm),
    annualGrowth: annualGrowth
  };
}

// Main request handler
async function handleRequest(req: Request): Promise<Response> {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Authenticate the request
    const { authenticated, userId, error: authError } = await authenticateRequest(req);
    
    if (!authenticated) {
      return new Response(
        JSON.stringify({ error: authError || 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the request body
    const requestData: ValuationRequest = await req.json();
    
    // Validate the request
    if (!requestData.appraisalId) {
      return new Response(
        JSON.stringify({ error: 'Appraisal ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate the valuation
    const result = await calculateValuation(requestData);
    
    // Return the result
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Error processing request',
      error: error.message
    }));
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Error processing request: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
}

// Serve the function with CSRF protection
serve(withCsrfProtection(handleRequest, { enforceForMutations: true })); 