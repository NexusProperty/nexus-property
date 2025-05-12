import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

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

// Handle HTTP requests
serve(async (req: Request) => {
  // Set CORS headers
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
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Authenticate the request
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
    
    // Validate required fields
    if (!requestData.appraisalId) {
      throw new Error('Missing required field: appraisalId');
    }
    
    if (!requestData.propertyDetails) {
      throw new Error('Missing required field: propertyDetails');
    }
    
    if (!requestData.comparableProperties || !Array.isArray(requestData.comparableProperties)) {
      throw new Error('Missing or invalid field: comparableProperties');
    }
    
    // Calculate valuation
    const valuationResult = await calculateValuation(requestData);
    
    // If valuation was successful, update the appraisal in the database
    if (valuationResult.success && valuationResult.data) {
      const { error: updateError } = await supabaseClient
        .from('appraisals')
        .update({
          valuation_low: valuationResult.data.valuationLow,
          valuation_high: valuationResult.data.valuationHigh,
          valuation_confidence: valuationResult.data.valuationConfidence,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestData.appraisalId);
      
      if (updateError) {
        console.error(JSON.stringify({
          level: 'error',
          message: 'Error updating appraisal',
          error: updateError.message,
          appraisalId: requestData.appraisalId
        }));
      } else {
        console.log(JSON.stringify({
          level: 'info',
          message: 'Successfully updated appraisal',
          appraisalId: requestData.appraisalId
        }));
      }
    }
    
    // Return the valuation result
    return new Response(
      JSON.stringify(valuationResult),
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