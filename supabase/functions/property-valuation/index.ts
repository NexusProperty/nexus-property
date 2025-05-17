import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { withCsrfProtection } from '../utils/csrf-middleware.ts';
import { withAuth, getAuthUser } from '../utils/auth-middleware.ts';

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
  // CoreLogic AVM data fields
  corelogic?: {
    avm_estimate?: number;
    avm_range_low?: number;
    avm_range_high?: number;
    avm_confidence?: string; // 'high', 'medium', 'low'
    property_id?: string;    // CoreLogic property ID
    avm_last_updated?: string; // Date of last AVM update
    confidence_score?: number; // Numerical confidence score (0-100)
    forecast_standard_deviation?: number; // Standard deviation for forecast
    valuation_method?: string; // Method used for valuation
  };
  // REINZ AVM data
  reinz?: {
    avm_estimate?: number;
    confidence_level?: string;
    last_updated?: string;
  };
  // Market statistics
  marketStatistics?: {
    corelogic?: Record<string, any>;
    reinz?: Record<string, any>;
    propertyActivitySummary?: Record<string, any>; // New property activity summary
    marketTrendsTimeframe?: string; // Timeframe for market trends ('3m', '6m', '1y', etc.)
  };
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
  // Additional CoreLogic property attributes
  architecturalStyle?: string;
  constructionMaterials?: string[];
  condition?: string;
  quality?: string;
  heating?: string[];
  cooling?: string[];
  parkingType?: string;
  parkingSpaces?: number;
  view?: string;
  aspect?: string;
  // New enhanced property attributes
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
  title_details?: {
    title_type?: string;
    ownership_type?: string;
    legal_description?: string;
  };
  zoning?: string;
  floodRisk?: string;
  earthquakeRisk?: string;
  landContour?: string;
  accessibility?: string;
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
  similarityScore: number;
  distanceKm?: number;
  daysOnMarket?: number;
  // Additional comparable property fields
  architecturalStyle?: string;
  constructionMaterials?: string[];
  condition?: string;
  quality?: string;
  view?: string;
  aspect?: string;
  // New enhanced property attributes
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
  title_details?: {
    title_type?: string;
    ownership_type?: string;
    legal_description?: string;
  };
  zoning?: string;
  floodRisk?: string;
  earthquakeRisk?: string;
  landContour?: string;
  accessibility?: string;
  schoolZones?: string[];
}

interface ValuationResult {
  success: boolean;
  error?: string;
  data?: {
    valuationLow: number;
    valuationHigh: number;
    valuationMid: number; // Added midpoint
    valuationConfidence: number; // 0 to 1
    confidenceCategory: 'Very High' | 'High' | 'Moderate' | 'Low'; // Added confidence category
    valuationSources: {
      comparableBased?: {
        low: number;
        mid: number;
        high: number;
        confidence: number;
        methodologyNotes?: string; // Explanation of methodology used
        weightDistribution?: Record<string, number>; // Distribution of weights
      };
      corelogicAvm?: {
        low: number;
        estimate: number;
        high: number;
        confidence: number;
        confidenceLabel: string;
        lastUpdated?: string; // When the AVM was last updated
        forecastStandardDeviation?: number; // Standard deviation for forecast
        valuationMethod?: string; // Method used for valuation
      };
      reinzAvm?: {
        estimate: number;
        confidenceLevel?: string;
        lastUpdated?: string;
      };
      blendRatio?: string; // Text explanation of blend ratio used
      hybridMethodology?: string; // Description of hybrid methodology
    };
    adjustedComparables: Array<{
      id: string;
      address: string;
      salePrice: number;
      adjustedPrice: number;
      adjustmentFactor: number;
      adjustmentExplanation?: string; // Added detailed explanation
      adjustmentBreakdown?: Record<string, number>; // Detailed breakdown of adjustments
      weight: number;
      isOutlier: boolean;
      outlierScore?: number; // Added strength of outlier detection (0-1)
      saleDate?: string; // Date of the sale
      daysOnMarket?: number; // How long the property was on market
      distanceFromSubject?: number; // Distance from subject property
    }>;
    valuationFactors: {
      bedroomValue?: number;
      bathroomValue?: number;
      landSizeValue?: number;
      floorAreaValue?: number;
      locationFactor?: number;
      ageAdjustment?: number;
      // Additional CoreLogic factors
      architecturalStyleAdjustment?: number;
      constructionMaterialsAdjustment?: number;
      conditionAdjustment?: number;
      qualityAdjustment?: number;
      viewAdjustment?: number;
      // Enhanced valuation factors
      renovationAdjustment?: number;
      energyEfficiencyAdjustment?: number;
      outdoorFeaturesValue?: number;
      indoorFeaturesValue?: number;
      zoningImpact?: number;
      schoolZoneImpact?: number;
      accessibilityImpact?: number;
      floodRiskImpact?: number;
      earthquakeRiskImpact?: number;
    };
    marketTrends: {
      medianPrice: number;
      pricePerSqm: number;
      annualGrowth: number;
      // Added market trends
      quarterlyGrowth?: number;
      demandIndex?: number; // 0-10
      supplyIndex?: number; // 0-10
      daysOnMarket?: number;
      medianPriceChange?: {
        threeMonth: number;
        sixMonth: number;
        twelveMonth: number;
      };
      salesVolume?: {
        current: number;
        previousPeriod: number;
        yearAgo: number;
        percentageChange?: number;
      };
      marketType?: 'Buyer' | 'Neutral' | 'Seller'; // Market characterization
      propertyTypeBreakdown?: Record<string, {
        medianPrice: number;
        annualGrowth: number;
        inventory: number;
      }>;
      recentHighestSale?: {
        price: number;
        address: string;
        date: string;
      };
      recentLowestSale?: {
        price: number;
        address: string;
        date: string;
      };
      inventoryLevels?: {
        current: number;
        previousPeriod: number;
        yearAgo: number;
        percentageChange?: number;
      };
      priceDistribution?: {
        ranges: string[];
        counts: number[];
      };
    };
    confidenceBreakdown?: {
      dataQuality: number; // 0-1 
      comparableRelevance: number; // 0-1
      dataRecency: number; // 0-1
      statConsistency: number; // 0-1
      marketVolatility: number; // 0-1
      avmConfidence: number; // 0-1
      // Additional confidence factors
      propertyComplexityFactor: number; // 0-1, how complex/unique the property is
      dataQualities: {
        comparablesCount: number;
        comparablesRelevanceScore: number; // 0-1
        mostRecentComparableDays: number;
        avmDataFreshness?: number; // days since last AVM update
        outlierPercentage: number;
        dataConsistencyScore: number; // 0-1
      };
      marketFactors: {
        volatilityScore: number; // 0-1
        supplyDemandBalance: number; // 0-1
        priceMovementSpeed: number; // 0-1
      };
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
    comparableCount: request.comparableProperties.length,
    hasAvmData: !!request.corelogic?.avm_estimate,
    hasReinzData: !!request.reinz?.avm_estimate
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

    // 2. Detect and handle outliers using Modified Z-score method (improved outlier detection)
    const { gradedComparables, outliers } = detectOutliersAdvanced(validComparables, request.propertyDetails);
    
    if (gradedComparables.filter(comp => comp.outlierScore < 0.5).length < 2) {
      // If not enough good comparables, check if we have AVM data to fall back on
      if (!request.corelogic?.avm_estimate && !request.reinz?.avm_estimate) {
        throw new Error('Not enough valid comparable properties after outlier detection and no AVM data available');
      }
      // Log this as a warning but continue with limited comparables and AVM data
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Limited number of good comparables, will rely more heavily on AVM data',
        goodComparableCount: gradedComparables.filter(comp => comp.outlierScore < 0.5).length,
        hasAvmData: !!request.corelogic?.avm_estimate
      }));
    }

    // 3. Calculate adjusted prices for each comparable with enhanced adjustment factors
    const adjustedComparables = calculateEnhancedAdjustedPrices(
      gradedComparables, 
      request.propertyDetails,
      request.marketStatistics
    );

    // 4. Apply improved weights based on similarity, recency, distance, and market relevance
    const weightedComparables = applyEnhancedWeights(adjustedComparables);
    
    // 5. Calculate comparable-based valuation
    const comparableBasedValuation = calculateComparableBasedValuation(
      weightedComparables, 
      request.propertyDetails
    );
    
    // 6. Process CoreLogic AVM data if available
    const corelogicAvm = processAvmData(request.corelogic);
    
    // 7. Process REINZ AVM estimate if available
    const reinzAvm = request.reinz?.avm_estimate ? {
      estimate: request.reinz.avm_estimate,
      confidenceLevel: request.reinz.confidence_level,
      lastUpdated: request.reinz.last_updated
    } : undefined;
    
    // 8. Calculate hybrid valuation (blend of comparable and AVM)
    const hybridValuation = calculateHybridValuation(
      comparableBasedValuation,
      corelogicAvm,
      reinzAvm,
      gradedComparables.filter(comp => comp.outlierScore < 0.5).length // Pass good comparable count
    );
    
    // 9. Calculate comprehensive confidence score with breakdown
    const confidenceResult = calculateEnhancedConfidenceScore(
      weightedComparables,
      request.propertyDetails,
      outliers.map(o => o.outlierScore),
      corelogicAvm,
      request.corelogic, // Pass full CoreLogic data
      request.reinz // Pass REINZ data
    );

    // 10. Calculate enhanced market trends using CoreLogic/REINZ data when available
    const marketTrends = calculateEnhancedMarketTrends(
      weightedComparables,
      request.marketStatistics
    );

    // 11. Combine all data into final result
    return {
      success: true,
      data: {
        valuationLow: Math.round(hybridValuation.low),
        valuationMid: Math.round(hybridValuation.mid),
        valuationHigh: Math.round(hybridValuation.high),
        valuationConfidence: hybridValuation.confidence,
        confidenceCategory: getConfidenceCategory(hybridValuation.confidence),
        valuationSources: {
          comparableBased: {
            low: Math.round(comparableBasedValuation.low),
            mid: Math.round(comparableBasedValuation.mid),
            high: Math.round(comparableBasedValuation.high),
            confidence: comparableBasedValuation.confidence,
            methodologyNotes: comparableBasedValuation.methodologyNotes,
            weightDistribution: comparableBasedValuation.weightDistribution
          },
          corelogicAvm: corelogicAvm ? {
            low: Math.round(corelogicAvm.low),
            estimate: Math.round(corelogicAvm.estimate),
            high: Math.round(corelogicAvm.high),
            confidence: corelogicAvm.confidence,
            confidenceLabel: corelogicAvm.confidenceLabel,
            lastUpdated: corelogicAvm.lastUpdated,
            forecastStandardDeviation: corelogicAvm.forecastStandardDeviation,
            valuationMethod: corelogicAvm.valuationMethod
          } : undefined,
          reinzAvm: reinzAvm ? {
            estimate: Math.round(reinzAvm.estimate),
            confidenceLevel: reinzAvm.confidenceLevel,
            lastUpdated: reinzAvm.lastUpdated
          } : undefined,
          blendRatio: hybridValuation.blend,
          hybridMethodology: hybridValuation.hybridMethodology
        },
        adjustedComparables: weightedComparables.map(comp => ({
          id: comp.id,
          address: comp.address,
          salePrice: comp.salePrice!,
          adjustedPrice: Math.round(comp.adjustedPrice!),
          adjustmentFactor: comp.adjustmentFactor!,
          adjustmentExplanation: comp.adjustmentExplanation,
          adjustmentBreakdown: comp.adjustmentBreakdown,
          weight: comp.weight!,
          isOutlier: comp.isOutlier || false,
          outlierScore: comp.outlierScore,
          saleDate: comp.saleDate,
          daysOnMarket: comp.daysOnMarket,
          distanceFromSubject: comp.distanceKm
        })),
        valuationFactors: comparableBasedValuation.factors,
        marketTrends,
        confidenceBreakdown: confidenceResult.breakdown
      }
    };
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Error calculating valuation',
      error: error.message,
      stack: error.stack
    }));
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to detect outliers using improved Modified Z-score method
function detectOutliersAdvanced(
  comparables: ComparableProperty[],
  propertyDetails: PropertyDetails
): { 
  gradedComparables: Array<ComparableProperty & { outlierScore: number }>, 
  outliers: Array<ComparableProperty & { outlierScore: number }> 
} {
  // Get valid comparables with sale prices
  const validComparables = comparables.filter(comp => 
    comp.salePrice !== null && comp.salePrice !== undefined && comp.salePrice > 0
  );
  
  if (validComparables.length === 0) {
    return { 
      gradedComparables: [], 
      outliers: [] 
    };
  }
  
  // Extract prices
  const prices = validComparables.map(comp => comp.salePrice!);
  
  // Calculate median price
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const median = calculateMedian(sortedPrices);
  
  // Calculate Modified Z-scores using Median Absolute Deviation (MAD)
  // MAD is more robust against extreme outliers than standard deviation
  const deviations = prices.map(price => Math.abs(price - median));
  const mad = calculateMedian(deviations);
  
  // Calculate modified Z-score for each comparable
  // Modified Z-score = 0.6745 * (x - median) / MAD
  // The constant 0.6745 makes the modified Z-score comparable to standard Z-score for normal distributions
  // We use absolute value to measure distance from median in either direction
  let modifiedZScores: number[] = [];
  
  if (mad === 0) {
    // If MAD is 0 (all values equal), no outliers
    modifiedZScores = prices.map(() => 0);
  } else {
    modifiedZScores = prices.map(price => 
      Math.abs(0.6745 * (price - median) / mad)
    );
  }
  
  // Calculate additional outlier factors based on property attributes
  const outlierFactors = validComparables.map(comp => {
    const factors = [];
    
    // 1. Property type mismatch (strong factor)
    if (comp.propertyType !== propertyDetails.propertyType) {
      factors.push(1.5);
    }
    
    // 2. Bedroom count difference (moderate factor)
    if (comp.bedrooms !== undefined && propertyDetails.bedrooms !== undefined) {
      const bedroomDiff = Math.abs(comp.bedrooms - propertyDetails.bedrooms);
      if (bedroomDiff >= 2) {
        factors.push(1.2);
      } else if (bedroomDiff === 1) {
        factors.push(0.3);
      }
    }
    
    // 3. Bathroom count difference (moderate factor)
    if (comp.bathrooms !== undefined && propertyDetails.bathrooms !== undefined) {
      const bathroomDiff = Math.abs(comp.bathrooms - propertyDetails.bathrooms);
      if (bathroomDiff >= 2) {
        factors.push(1.0);
      } else if (bathroomDiff === 1) {
        factors.push(0.2);
      }
    }
    
    // 4. Land size difference (stronger for larger differences)
    if (comp.landSize !== undefined && propertyDetails.landSize !== undefined) {
      const landSizeRatio = Math.max(comp.landSize, propertyDetails.landSize) / 
                          Math.max(1, Math.min(comp.landSize, propertyDetails.landSize));
      if (landSizeRatio > 3) {
        factors.push(1.2);
      } else if (landSizeRatio > 2) {
        factors.push(0.8);
      } else if (landSizeRatio > 1.5) {
        factors.push(0.4);
      }
    }
    
    // 5. Floor area difference
    if (comp.floorArea !== undefined && propertyDetails.floorArea !== undefined) {
      const floorAreaRatio = Math.max(comp.floorArea, propertyDetails.floorArea) / 
                            Math.max(1, Math.min(comp.floorArea, propertyDetails.floorArea));
      if (floorAreaRatio > 2) {
        factors.push(1.0);
      } else if (floorAreaRatio > 1.5) {
        factors.push(0.6);
      } else if (floorAreaRatio > 1.3) {
        factors.push(0.3);
      }
    }
    
    // 6. Age difference
    if (comp.yearBuilt !== undefined && propertyDetails.yearBuilt !== undefined) {
      const ageDiff = Math.abs(comp.yearBuilt - propertyDetails.yearBuilt);
      if (ageDiff > 30) {
        factors.push(0.8);
      } else if (ageDiff > 15) {
        factors.push(0.4);
      } else if (ageDiff > 7) {
        factors.push(0.2);
      }
    }
    
    // 7. Distance factor (if available)
    if (comp.distanceKm !== undefined) {
      if (comp.distanceKm > 5) {
        factors.push(0.8);
      } else if (comp.distanceKm > 2) {
        factors.push(0.4);
      } else if (comp.distanceKm > 1) {
        factors.push(0.2);
      }
    }
    
    // 8. Sale recency (if available)
    if (comp.saleDate) {
      const saleDate = new Date(comp.saleDate);
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - saleDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - saleDate.getMonth());
      
      if (monthsDiff > 24) {
        factors.push(0.9);
      } else if (monthsDiff > 12) {
        factors.push(0.5);
      } else if (monthsDiff > 6) {
        factors.push(0.2);
      }
    }
    
    // Calculate average factor (or 0 if no factors)
    return factors.length > 0 ? 
      factors.reduce((sum, factor) => sum + factor, 0) / factors.length : 
      0;
  });
  
  // Apply statistical threshold for outliers (typically >3.5 is considered an outlier with Modified Z-score)
  // Combine with attribute-based factors for a comprehensive score
  // Final outlier score is on a scale of 0-1, with higher values indicating stronger outlier status
  const outlierScores = modifiedZScores.map((zscore, index) => {
    // Convert Z-score to 0-1 scale (>3.5 is a strong outlier, 0 is not an outlier)
    const zScoreComponent = Math.min(1, zscore / 3.5);
    
    // Combine with attribute factors
    const combinedScore = Math.min(1, zScoreComponent * 0.7 + outlierFactors[index] * 0.3);
    
    return combinedScore;
  });
  
  // Add outlier scores to comparables
  const gradedComparables = validComparables.map((comp, index) => ({
    ...comp,
    outlierScore: outlierScores[index]
  }));
  
  // Strong outliers (score >= 0.7) will be flagged but still included in calculations with reduced weight
  const outliers = gradedComparables.filter(comp => comp.outlierScore >= 0.7);
  
  return {
    gradedComparables,
    outliers
  };
}

// Helper function to calculate enhanced adjusted prices with additional property attributes
function calculateEnhancedAdjustedPrices(
  comparables: Array<ComparableProperty & { outlierScore: number }>, 
  propertyDetails: PropertyDetails,
  marketStatistics?: {
    corelogic?: Record<string, any>;
    reinz?: Record<string, any>;
  }
): Array<ComparableProperty & { 
  adjustedPrice?: number, 
  adjustmentFactor?: number,
  adjustmentExplanation?: string,
  adjustmentBreakdown?: Record<string, number>,
  isOutlier?: boolean,
  outlierScore: number
}> {
  return comparables.map(comp => {
    let adjustmentFactor = 1.0;
    const adjustmentDetails: string[] = [];
    
    // Adjust for bedrooms difference
    if (comp.bedrooms !== undefined && propertyDetails.bedrooms !== undefined) {
      const bedroomDiff = propertyDetails.bedrooms - comp.bedrooms;
      // Dynamic bedroom adjustment based on property type and price point
      let bedroomAdjustmentRate = 0.05; // Default 5% per bedroom
      
      // Adjust bedroom value based on property type
      if (propertyDetails.propertyType === 'Apartment') {
        bedroomAdjustmentRate = 0.08; // Higher impact for apartments
      } else if (propertyDetails.propertyType === 'Lifestyle') {
        bedroomAdjustmentRate = 0.03; // Lower impact for lifestyle properties
      }
      
      const bedroomAdjustment = bedroomDiff * bedroomAdjustmentRate;
      adjustmentFactor += bedroomAdjustment;
      
      if (bedroomDiff !== 0) {
        adjustmentDetails.push(`${Math.abs(bedroomDiff)} bedroom ${bedroomDiff > 0 ? 'increase' : 'decrease'}: ${(bedroomAdjustment * 100).toFixed(1)}%`);
      }
    }
    
    // Adjust for bathrooms difference
    if (comp.bathrooms !== undefined && propertyDetails.bathrooms !== undefined) {
      const bathroomDiff = propertyDetails.bathrooms - comp.bathrooms;
      // Dynamic bathroom adjustment
      let bathroomAdjustmentRate = 0.03; // Default 3% per bathroom
      
      // For higher-end properties, bathrooms have more impact
      if (comp.salePrice! > 1000000) {
        bathroomAdjustmentRate = 0.04;
      }
      
      const bathroomAdjustment = bathroomDiff * bathroomAdjustmentRate;
      adjustmentFactor += bathroomAdjustment;
      
      if (bathroomDiff !== 0) {
        adjustmentDetails.push(`${Math.abs(bathroomDiff)} bathroom ${bathroomDiff > 0 ? 'increase' : 'decrease'}: ${(bathroomAdjustment * 100).toFixed(1)}%`);
      }
    }
    
    // Adjust for land size difference
    if (comp.landSize !== undefined && propertyDetails.landSize !== undefined && comp.landSize > 0) {
      // Use logarithmic adjustment for land size to better reflect diminishing returns
      // for very large differences in land size
      const landSizeRatio = propertyDetails.landSize / comp.landSize;
      const logBase = 1.5;
      let landSizeAdjustment = 0;
      
      if (landSizeRatio !== 1) {
        landSizeAdjustment = 0.1 * Math.log(landSizeRatio) / Math.log(logBase);
        
        // Cap extreme adjustments
        landSizeAdjustment = Math.max(Math.min(landSizeAdjustment, 0.3), -0.25);
      }
      
      adjustmentFactor += landSizeAdjustment;
      
      if (landSizeAdjustment !== 0) {
        adjustmentDetails.push(`Land size (${propertyDetails.landSize}m² vs ${comp.landSize}m²): ${(landSizeAdjustment * 100).toFixed(1)}%`);
      }
    }
    
    // Adjust for floor area difference
    if (comp.floorArea !== undefined && propertyDetails.floorArea !== undefined && comp.floorArea > 0) {
      // Use logarithmic adjustment for floor area to better reflect market reality
      const floorAreaRatio = propertyDetails.floorArea / comp.floorArea;
      const logBase = 1.3;
      let floorAreaAdjustment = 0;
      
      if (floorAreaRatio !== 1) {
        floorAreaAdjustment = 0.15 * Math.log(floorAreaRatio) / Math.log(logBase);
        
        // Cap extreme adjustments
        floorAreaAdjustment = Math.max(Math.min(floorAreaAdjustment, 0.35), -0.3);
      }
      
      adjustmentFactor += floorAreaAdjustment;
      
      if (floorAreaAdjustment !== 0) {
        adjustmentDetails.push(`Floor area (${propertyDetails.floorArea}m² vs ${comp.floorArea}m²): ${(floorAreaAdjustment * 100).toFixed(1)}%`);
      }
    }
    
    // Adjust for age/year built with progressive scaling (newer properties command higher premium)
    if (comp.yearBuilt !== undefined && propertyDetails.yearBuilt !== undefined) {
      const ageDiff = propertyDetails.yearBuilt - comp.yearBuilt;
      
      // Progressive age adjustment - more impact for newer properties
      let ageAdjustmentRate = 0.005; // Base rate of 0.5% per year
      
      // For newer properties (less than 10 years old), age has more impact
      if (propertyDetails.yearBuilt >= new Date().getFullYear() - 10) {
        ageAdjustmentRate = 0.008; // 0.8% per year for newer properties
      } 
      // For older properties (more than 50 years), age has less impact after a point
      else if (propertyDetails.yearBuilt <= new Date().getFullYear() - 50) {
        ageAdjustmentRate = 0.002; // 0.2% per year for older properties
      }
      
      const ageAdjustment = ageDiff * ageAdjustmentRate;
      adjustmentFactor += ageAdjustment;
      
      if (ageDiff !== 0) {
        adjustmentDetails.push(`Age (${propertyDetails.yearBuilt} vs ${comp.yearBuilt}): ${(ageAdjustment * 100).toFixed(1)}%`);
      }
    }
    
    // Adjust for property type with more granular categories
    if (comp.propertyType !== propertyDetails.propertyType) {
      let propertyTypeAdjustment = -0.1; // Default 10% reduction
      
      // More granular adjustments based on property type combinations
      const typeCombo = `${comp.propertyType}->${propertyDetails.propertyType}`;
      
      switch (typeCombo) {
        case 'House->Apartment':
          propertyTypeAdjustment = -0.15;
          break;
        case 'Apartment->House':
          propertyTypeAdjustment = 0.15;
          break;
        case 'House->Townhouse':
          propertyTypeAdjustment = -0.08;
          break;
        case 'Townhouse->House':
          propertyTypeAdjustment = 0.08;
          break;
        case 'Apartment->Townhouse':
          propertyTypeAdjustment = 0.05;
          break;
        case 'Townhouse->Apartment':
          propertyTypeAdjustment = -0.05;
          break;
        // Add other combinations as needed
      }
      
      adjustmentFactor += propertyTypeAdjustment;
      adjustmentDetails.push(`Property type (${propertyDetails.propertyType} vs ${comp.propertyType}): ${(propertyTypeAdjustment * 100).toFixed(1)}%`);
    }
    
    // Adjust for recency of sale with market-based trends when available
    if (comp.saleDate) {
      const saleDate = new Date(comp.saleDate);
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - saleDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - saleDate.getMonth());
      
      // Default monthly growth rate if market data not available
      let monthlyGrowthRate = 0.005; // 0.5% default
      
      // Use market data if available to determine growth rate
      if (marketStatistics?.corelogic?.quarterlyGrowth || marketStatistics?.reinz?.quarterlyGrowth) {
        // Convert quarterly growth to monthly
        const quarterlyGrowth = marketStatistics?.corelogic?.quarterlyGrowth || 
                               marketStatistics?.reinz?.quarterlyGrowth || 0.015;
        
        monthlyGrowthRate = quarterlyGrowth / 3;
      }
      
      // Apply seasonal adjustment if applicable
      const saleMonth = saleDate.getMonth();
      const currentMonth = currentDate.getMonth();
      let seasonalAdjustment = 0;
      
      // Simplified seasonal adjustments (could be more sophisticated with real market data)
      if ((saleMonth >= 11 || saleMonth <= 1) && (currentMonth >= 5 && currentMonth <= 7)) {
        // Summer to winter adjustment
        seasonalAdjustment = -0.01;
      } else if ((saleMonth >= 5 && saleMonth <= 7) && (currentMonth >= 11 || currentMonth <= 1)) {
        // Winter to summer adjustment
        seasonalAdjustment = 0.01;
      }
      
      const growthAdjustment = monthsDiff * monthlyGrowthRate + seasonalAdjustment;
      adjustmentFactor += growthAdjustment;
      
      adjustmentDetails.push(`Time adjustment (${monthsDiff} months): ${(growthAdjustment * 100).toFixed(1)}%`);
    }
    
    // Adjust for architectural style if available
    if (propertyDetails.architecturalStyle && comp.architecturalStyle) {
      let architecturalStyleAdjustment = 0;
      
      if (propertyDetails.architecturalStyle !== comp.architecturalStyle) {
        // Premium styles command higher values
        const premiumStyles = ['Contemporary', 'Modern', 'Architectural', 'Designer'];
        const standardStyles = ['Traditional', 'Colonial', 'Bungalow'];
        
        if (premiumStyles.includes(propertyDetails.architecturalStyle) && 
            !premiumStyles.includes(comp.architecturalStyle)) {
          architecturalStyleAdjustment = 0.03;
        } else if (!premiumStyles.includes(propertyDetails.architecturalStyle) && 
                   premiumStyles.includes(comp.architecturalStyle)) {
          architecturalStyleAdjustment = -0.03;
        }
        
        adjustmentFactor += architecturalStyleAdjustment;
        
        if (architecturalStyleAdjustment !== 0) {
          adjustmentDetails.push(`Architectural style: ${(architecturalStyleAdjustment * 100).toFixed(1)}%`);
        }
      }
    }
    
    // Adjust for construction materials if available
    if (propertyDetails.constructionMaterials && comp.constructionMaterials) {
      let materialsAdjustment = 0;
      
      // Premium materials adjustment
      const premiumMaterials = ['Brick', 'Stone', 'Concrete', 'Steel'];
      
      const subjectPremiumCount = propertyDetails.constructionMaterials.filter(
        m => premiumMaterials.includes(m)
      ).length;
      
      const compPremiumCount = comp.constructionMaterials.filter(
        m => premiumMaterials.includes(m)
      ).length;
      
      if (subjectPremiumCount !== compPremiumCount) {
        materialsAdjustment = (subjectPremiumCount - compPremiumCount) * 0.02;
        
        // Cap adjustment
        materialsAdjustment = Math.max(Math.min(materialsAdjustment, 0.06), -0.06);
        
        adjustmentFactor += materialsAdjustment;
        adjustmentDetails.push(`Construction materials: ${(materialsAdjustment * 100).toFixed(1)}%`);
      }
    }
    
    // Adjust for condition if available
    if (propertyDetails.condition && comp.condition) {
      let conditionAdjustment = 0;
      
      // Condition rating map (higher = better)
      const conditionRating: Record<string, number> = {
        'Poor': 1,
        'Fair': 2,
        'Average': 3,
        'Good': 4,
        'Excellent': 5
      };
      
      if (conditionRating[propertyDetails.condition] !== conditionRating[comp.condition]) {
        const ratingDiff = conditionRating[propertyDetails.condition] - conditionRating[comp.condition];
        conditionAdjustment = ratingDiff * 0.03;
        
        adjustmentFactor += conditionAdjustment;
        adjustmentDetails.push(`Condition (${propertyDetails.condition} vs ${comp.condition}): ${(conditionAdjustment * 100).toFixed(1)}%`);
      }
    }
    
    // Adjust for view if available
    if (propertyDetails.view && comp.view) {
      let viewAdjustment = 0;
      
      // View rating map (higher = better)
      const viewRating: Record<string, number> = {
        'None': 1,
        'Limited': 2,
        'Partial': 3,
        'Good': 4,
        'Panoramic': 5
      };
      
      if (viewRating[propertyDetails.view] !== viewRating[comp.view]) {
        const ratingDiff = viewRating[propertyDetails.view] - viewRating[comp.view];
        viewAdjustment = ratingDiff * 0.02;
        
        adjustmentFactor += viewAdjustment;
        adjustmentDetails.push(`View (${propertyDetails.view} vs ${comp.view}): ${(viewAdjustment * 100).toFixed(1)}%`);
      }
    }
    
    // Calculate adjusted price
    const adjustedPrice = comp.salePrice! * adjustmentFactor;
    
    // Generate final explanation text
    const adjustmentExplanation = adjustmentDetails.join(', ');
    
    // Calculate adjustment breakdown
    const adjustmentBreakdown: Record<string, number> = {};
    adjustmentDetails.forEach(detail => {
      const [key, value] = detail.split(': ');
      adjustmentBreakdown[key] = parseFloat(value.replace('%', ''));
    });
    
    // Return enhanced data
    return {
      ...comp,
      adjustedPrice,
      adjustmentFactor,
      adjustmentExplanation,
      adjustmentBreakdown,
      isOutlier: comp.outlierScore > 0.7, // Consider strong outliers
      outlierScore: comp.outlierScore
    };
  });
}

// Helper function to apply enhanced weights with improved factors
function applyEnhancedWeights(comparables: Array<ComparableProperty & { 
  adjustedPrice?: number, 
  adjustmentFactor?: number,
  adjustmentExplanation?: string,
  adjustmentBreakdown?: Record<string, number>,
  isOutlier?: boolean,
  outlierScore: number
}>): Array<ComparableProperty & { 
  adjustedPrice?: number, 
  adjustmentFactor?: number,
  adjustmentExplanation?: string,
  adjustmentBreakdown?: Record<string, number>,
  weight?: number,
  isOutlier?: boolean,
  outlierScore: number
}> {
  // Enhanced weighting system with more factors:
  // - similarity score (35%)
  // - recency (25%)
  // - distance (20%)
  // - adjustment magnitude (10%)
  // - property type match (10%)
  
  // Calculate the adjustment magnitude for each comparable (lower is better)
  const adjustmentMagnitudes = comparables.map(comp => 
    comp.adjustmentFactor ? Math.abs(comp.adjustmentFactor - 1) : 0
  );
  
  // Max adjustment magnitude for normalization
  const maxAdjustment = Math.max(...adjustmentMagnitudes, 0.5);
  
  return comparables.map((comp, index) => {
    let weight = 0;
    
    // Similarity score weight (35%)
    const similarityWeight = (comp.similarityScore / 100) * 0.35;
    weight += similarityWeight;
    
    // Recency weight (25%) with exponential decay
    if (comp.saleDate) {
      const saleDate = new Date(comp.saleDate);
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - saleDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - saleDate.getMonth());
      
      // Use exponential decay for a more realistic weighting of older sales
      // Formula: e^(-monthsDiff/timeConstant)
      const timeConstant = 18; // Decay constant (18 months = ~0.37 weight)
      const recencyWeight = Math.exp(-monthsDiff / timeConstant) * 0.25;
      weight += recencyWeight;
    } else {
      // If no sale date, assign a low recency weight
      weight += 0.1;
    }
    
    // Distance weight (20%) with exponential decay for distance
    if (comp.distanceKm !== undefined) {
      // Use exponential decay for more realistic distance weighting
      // Formula: e^(-distance/distanceConstant)
      const distanceConstant = 5; // 5km = ~0.37 weight
      const distanceWeight = Math.exp(-comp.distanceKm / distanceConstant) * 0.2;
      weight += distanceWeight;
    } else {
      // If no distance provided, assign a low distance weight
      weight += 0.08;
    }
    
    // Adjustment magnitude weight (10%) - lower adjustments get higher weight
    const adjustmentMagnitude = adjustmentMagnitudes[index];
    const adjustmentWeight = (1 - adjustmentMagnitude / maxAdjustment) * 0.1;
    weight += adjustmentWeight;
    
    // Property type match weight (10%)
    if (comp.propertyType) {
      const typeMatchWeight = comp.propertyType === comp.propertyType ? 0.1 : 0.05;
      weight += typeMatchWeight;
    } else {
      weight += 0.05; // Default if no property type
    }
    
    // Apply outlier score to reduce weight of outliers
    // Use a graduated approach instead of binary outlier handling
    if (comp.outlierScore > 0) {
      // Progressive reduction based on outlier score
      // outlierScore 0.5 = ~70% of weight
      // outlierScore 0.7 = ~50% of weight
      // outlierScore 0.9 = ~30% of weight
      const outlierFactor = Math.pow(1 - comp.outlierScore, 2);
      weight *= outlierFactor;
    }
    
    return {
      ...comp,
      weight
    };
  });
}

// Helper function to calculate the comparable-based valuation
function calculateComparableBasedValuation(
  weightedComparables: Array<ComparableProperty & { 
    adjustedPrice?: number, 
    adjustmentFactor?: number,
    adjustmentExplanation?: string,
    adjustmentBreakdown?: Record<string, number>,
    weight?: number,
    isOutlier?: boolean,
    outlierScore: number
  }>,
  propertyDetails: PropertyDetails
): { 
  low: number; 
  mid: number;
  high: number; 
  confidence: number;
  factors: {
    bedroomValue?: number;
    bathroomValue?: number;
    landSizeValue?: number;
    floorAreaValue?: number;
    locationFactor?: number;
    ageAdjustment?: number;
    architecturalStyleAdjustment?: number;
    constructionMaterialsAdjustment?: number;
    conditionAdjustment?: number;
    qualityAdjustment?: number;
    viewAdjustment?: number;
  };
  methodologyNotes?: string;
  weightDistribution?: Record<string, number>;
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
  const weightedMean = normalizedComparables.reduce(
    (sum, comp) => sum + comp.adjustedPrice! * comp.normalizedWeight, 
    0
  );
  
  // Calculate standard deviation
  const variance = normalizedComparables.reduce(
    (sum, comp) => sum + Math.pow(comp.adjustedPrice! - weightedMean, 2) * comp.normalizedWeight,
    0
  );
  const standardDeviation = Math.sqrt(variance);
  
  // Calculate trimmed mean (removing highest and lowest 10% of values)
  // This is more robust against remaining outliers
  const trimPercent = 0.1;
  const trimmedComparables = [...normalizedComparables];
  
  // Sort and trim by price
  trimmedComparables.sort((a, b) => a.adjustedPrice! - b.adjustedPrice!);
  
  // Calculate total weight to trim from each end
  const weightToTrim = totalWeight * trimPercent;
  
  // Trim low end
  let cumulativeTrimLow = 0;
  while (cumulativeTrimLow < weightToTrim && trimmedComparables.length > 0) {
    const firstComp = trimmedComparables[0];
    if (cumulativeTrimLow + firstComp.normalizedWeight <= weightToTrim) {
      cumulativeTrimLow += firstComp.normalizedWeight;
      trimmedComparables.shift();
    } else {
      // Partial weight trimming on the boundary
      const remainingWeight = weightToTrim - cumulativeTrimLow;
      firstComp.normalizedWeight -= remainingWeight;
      cumulativeTrimLow = weightToTrim;
    }
  }
  
  // Trim high end
  let cumulativeTrimHigh = 0;
  while (cumulativeTrimHigh < weightToTrim && trimmedComparables.length > 0) {
    const lastComp = trimmedComparables[trimmedComparables.length - 1];
    if (cumulativeTrimHigh + lastComp.normalizedWeight <= weightToTrim) {
      cumulativeTrimHigh += lastComp.normalizedWeight;
      trimmedComparables.pop();
    } else {
      // Partial weight trimming on the boundary
      const remainingWeight = weightToTrim - cumulativeTrimHigh;
      lastComp.normalizedWeight -= remainingWeight;
      cumulativeTrimHigh = weightToTrim;
    }
  }
  
  // Renormalize weights after trimming
  const trimmedTotalWeight = trimmedComparables.reduce((sum, comp) => sum + comp.normalizedWeight, 0);
  trimmedComparables.forEach(comp => {
    comp.normalizedWeight = comp.normalizedWeight / trimmedTotalWeight;
  });
  
  // Calculate trimmed mean
  const trimmedMean = trimmedComparables.reduce(
    (sum, comp) => sum + comp.adjustedPrice! * comp.normalizedWeight, 
    0
  );
  
  // Calculate blended central estimate
  // Use weighted blend of median, mean, and trimmed mean for optimal result
  // More weight to median and trimmed mean for stability
  const midEstimate = medianPrice * 0.45 + trimmedMean * 0.45 + weightedMean * 0.1;
  
  // Calculate confidence based on data consistency
  let confidenceBase = 0.7; // Base confidence
  
  // Adjustment for coefficient of variation (measure of dispersion)
  const coefficientOfVariation = standardDeviation / weightedMean;
  let covBasedConfidence = 0;
  
  if (coefficientOfVariation < 0.05) {
    covBasedConfidence = 0.2; // Very consistent prices
  } else if (coefficientOfVariation < 0.1) {
    covBasedConfidence = 0.15; // Good consistency
  } else if (coefficientOfVariation < 0.15) {
    covBasedConfidence = 0.1; // Moderate consistency
  } else if (coefficientOfVariation < 0.2) {
    covBasedConfidence = 0.05; // Fair consistency
  } else {
    covBasedConfidence = 0; // Poor consistency
  }
  
  confidenceBase += covBasedConfidence;
  
  // Calculate range based on confidence and market data
  // Higher confidence = narrower range
  // We use a combination of coefficient of variation and sample size
  const minRangePercentage = 0.03; // Minimum 3% range
  let rangeMultiplier = 1.0;
  
  // Adjust range based on comparable count
  if (weightedComparables.length >= 10) {
    rangeMultiplier *= 0.9; // Tighter range with more comparables
  } else if (weightedComparables.length <= 3) {
    rangeMultiplier *= 1.2; // Wider range with few comparables
  }
  
  // Final range percentage calculation
  const rangePercentage = Math.max(minRangePercentage, coefficientOfVariation * rangeMultiplier);
  
  // Calculate low and high values
  const low = midEstimate * (1 - rangePercentage);
  const high = midEstimate * (1 + rangePercentage);
  
  // Calculate valuation factors for explanation
  const factors: {
    bedroomValue?: number;
    bathroomValue?: number;
    landSizeValue?: number;
    floorAreaValue?: number;
    locationFactor?: number;
    ageAdjustment?: number;
    architecturalStyleAdjustment?: number;
    constructionMaterialsAdjustment?: number;
    conditionAdjustment?: number;
    qualityAdjustment?: number;
    viewAdjustment?: number;
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
  
  // Calculate additional factors (architectural style, construction materials, etc.)
  if (propertyDetails.architecturalStyle) {
    // This would be calculated based on value differences between architectural styles
    // Simplified placeholder calculation
    factors.architecturalStyleAdjustment = 0.01; // 1% impact
  }
  
  if (propertyDetails.condition) {
    // Calculate condition impact from comparable data
    const conditionRating: Record<string, number> = {
      'Poor': 1,
      'Fair': 2,
      'Average': 3,
      'Good': 4,
      'Excellent': 5
    };
    
    factors.conditionAdjustment = conditionRating[propertyDetails.condition] * 0.01; // 1% per rating level
  }
  
  // Fixed: Use proper methodology notes
  const methodologyNotes = "Valuation calculated using weighted comparable analysis with adjustments for property attributes, location, and market factors.";
  
  // Fixed: Create proper weight distribution
  const weightDistribution: Record<string, number> = {};
  
  // Track contribution of each comparable to final valuation
  weightedComparables.forEach(comp => {
    if (comp.address && comp.weight) {
      weightDistribution[comp.address] = comp.weight / totalWeight;
    }
  });
  
  return { 
    low, 
    mid: midEstimate, 
    high, 
    confidence: confidenceBase,
    factors,
    methodologyNotes,
    weightDistribution
  };
}

// Process CoreLogic AVM data
function processAvmData(corelogicData?: {
  avm_estimate?: number;
  avm_range_low?: number;
  avm_range_high?: number;
  avm_confidence?: string;
  property_id?: string;
  avm_last_updated?: string;
  confidence_score?: number;
  forecast_standard_deviation?: number;
  valuation_method?: string;
}): {
  low: number;
  estimate: number;
  high: number;
  confidence: number;
  confidenceLabel: string;
  lastUpdated?: string;
  forecastStandardDeviation?: number;
  valuationMethod?: string;
} | null {
  // If no AVM data, return null
  if (!corelogicData?.avm_estimate) {
    return null;
  }
  
  // Map confidence string to numeric value
  let confidenceValue = 0.7; // Default confidence (moderate)
  const confidenceLabel = corelogicData.avm_confidence || 'moderate';
  
  switch (confidenceLabel.toLowerCase()) {
    case 'high':
      confidenceValue = 0.9;
      break;
    case 'medium':
    case 'moderate':
      confidenceValue = 0.7;
      break;
    case 'low':
      confidenceValue = 0.5;
      break;
    default:
      confidenceValue = 0.7;
  }
  
  // If range is provided, use it
  let lowValue = corelogicData.avm_range_low;
  let highValue = corelogicData.avm_range_high;
  
  // If range is not provided, calculate it based on confidence
  if (!lowValue || !highValue) {
    // Higher confidence = narrower range
    const rangePercentage = confidenceValue === 0.9 ? 0.05 : 
                           confidenceValue === 0.7 ? 0.08 : 0.12;
    
    lowValue = corelogicData.avm_estimate * (1 - rangePercentage);
    highValue = corelogicData.avm_estimate * (1 + rangePercentage);
  }
  
  // Include additional properties from CoreLogic data
  return {
    low: lowValue!,
    estimate: corelogicData.avm_estimate,
    high: highValue!,
    confidence: confidenceValue,
    confidenceLabel,
    lastUpdated: corelogicData.avm_last_updated,
    forecastStandardDeviation: corelogicData.forecast_standard_deviation,
    valuationMethod: corelogicData.valuation_method
  };
}

// Calculate hybrid valuation by blending comparable-based and AVM valuations
function calculateHybridValuation(
  comparableBasedValuation: { 
    low: number; 
    mid: number; 
    high: number; 
    confidence: number 
  },
  corelogicAvm: {
    low: number;
    estimate: number;
    high: number;
    confidence: number;
    confidenceLabel: string;
  } | null,
  reinzAvm: {
    estimate: number;
    confidenceLevel?: string;
    lastUpdated?: string;
  } | undefined,
  goodComparableCount: number
): { 
  low: number; 
  mid: number; 
  high: number; 
  confidence: number;
  blend: string;
  hybridMethodology?: string;
} {
  // If no AVM data available, return comparable-based valuation
  if (!corelogicAvm) {
    return {
      ...comparableBasedValuation,
      blend: "100% comparable-based (no AVM data)"
    };
  }
  
  // Calculate blending weights based on confidence scores
  const comparableWeight = comparableBasedValuation.confidence;
  const avmWeight = corelogicAvm.confidence;
  
  // Normalize weights to sum to 1
  const totalWeight = comparableWeight + avmWeight;
  const normalizedComparableWeight = comparableWeight / totalWeight;
  const normalizedAvmWeight = avmWeight / totalWeight;
  
  // Blend values using weighted average
  const blendedMid = (comparableBasedValuation.mid * normalizedComparableWeight) + 
                    (corelogicAvm.estimate * normalizedAvmWeight);
  
  // For range endpoints, we want to consider both sources but avoid extreme values
  // We'll use a more sophisticated approach that considers the overlapping range
  
  // Find the overlap range first
  const overlapLow = Math.max(comparableBasedValuation.low, corelogicAvm.low);
  const overlapHigh = Math.min(comparableBasedValuation.high, corelogicAvm.high);
  
  let blendedLow, blendedHigh;
  
  // If there's an overlap, favor the overlap range but extend slightly
  if (overlapLow <= overlapHigh) {
    // There is overlap - use it as the core of our range
    const overlapCenter = (overlapLow + overlapHigh) / 2;
    const overlapWidth = overlapHigh - overlapLow;
    
    // Extend the range based on confidence (lower confidence = wider extension)
    const extensionFactor = 1 - Math.min(comparableBasedValuation.confidence, corelogicAvm.confidence);
    const extension = overlapWidth * extensionFactor;
    
    blendedLow = Math.max(overlapLow - extension, 
                         Math.min(comparableBasedValuation.low, corelogicAvm.low));
    blendedHigh = Math.min(overlapHigh + extension, 
                          Math.max(comparableBasedValuation.high, corelogicAvm.high));
  } else {
    // No overlap - take weighted blend of limits
    blendedLow = (comparableBasedValuation.low * normalizedComparableWeight) + 
                (corelogicAvm.low * normalizedAvmWeight);
    blendedHigh = (comparableBasedValuation.high * normalizedComparableWeight) + 
                 (corelogicAvm.high * normalizedAvmWeight);
  }
  
  // If REINZ AVM is available, include it in the calculation
  if (reinzAvm?.estimate) {
    // Use REINZ as a reference point that can influence the range
    // but with lower weight than the other two methods
    const reinzWeight = 0.2;
    
    // Adjust mid value
    blendedMid = (blendedMid * (1 - reinzWeight)) + (reinzAvm.estimate * reinzWeight);
    
    // Expand range if REINZ estimate falls outside current range
    if (reinzAvm.estimate < blendedLow) {
      // Extend lower bound toward REINZ estimate
      blendedLow = (blendedLow * 0.8) + (reinzAvm.estimate * 0.2);
    }
    if (reinzAvm.estimate > blendedHigh) {
      // Extend upper bound toward REINZ estimate
      blendedHigh = (blendedHigh * 0.8) + (reinzAvm.estimate * 0.2);
    }
  }
  
  // Final combined confidence is higher than either individual confidence
  // The combination of methods increases overall reliability
  const blendedConfidence = Math.min(
    (comparableBasedValuation.confidence * normalizedComparableWeight) + 
    (corelogicAvm.confidence * normalizedAvmWeight) + 0.05, // Bonus for having multiple sources
    0.95 // Cap at 0.95
  );
  
  // Format the blend ratio explanation
  const comparablePercent = Math.round(normalizedComparableWeight * 100);
  const avmPercent = Math.round(normalizedAvmWeight * 100);
  let blendDescription = `${comparablePercent}% comparable-based, ${avmPercent}% CoreLogic AVM`;
  
  if (reinzAvm?.estimate) {
    blendDescription += " with REINZ AVM influence";
  }
  
  return {
    low: blendedLow,
    mid: blendedMid,
    high: blendedHigh,
    confidence: blendedConfidence,
    blend: blendDescription
  };
}

// Helper function to calculate enhanced confidence score with detailed breakdown
function calculateEnhancedConfidenceScore(
  weightedComparables: Array<ComparableProperty & { 
    adjustedPrice?: number, 
    weight?: number,
    isOutlier?: boolean,
    outlierScore: number
  }>,
  propertyDetails: PropertyDetails,
  outlierScores: number[],
  corelogicAvm: {
    confidence: number;
  } | null,
  fullCorelogicData?: {
    avm_estimate?: number;
    avm_confidence?: string;
    property_id?: string;
    avm_last_updated?: string;
    confidence_score?: number;
  },
  reinzData?: {
    avm_estimate?: number;
    confidence_level?: string;
    last_updated?: string;
  }
): {
  confidenceScore: number;
  breakdown: {
    dataQuality: number;
    comparableRelevance: number;
    dataRecency: number;
    statConsistency: number;
    marketVolatility: number;
    avmConfidence: number;
    propertyComplexityFactor: number;
    dataQualities: {
      comparablesCount: number;
      comparablesRelevanceScore: number;
      mostRecentComparableDays: number;
      avmDataFreshness?: number;
      outlierPercentage: number;
      dataConsistencyScore: number;
    };
    marketFactors: {
      volatilityScore: number;
      supplyDemandBalance: number;
      priceMovementSpeed: number;
    };
  }
} {
  // Filter out outliers and get valid comparables
  const validComparables = weightedComparables.filter(comp => 
    comp.outlierScore < 0.7 && 
    comp.salePrice && 
    comp.adjustedPrice
  );
  
  // Check if we have enough data for a meaningful confidence calculation
  if (validComparables.length < 2) {
    // Very low confidence due to lack of valid comparables
    return generateLowConfidenceResult(
      weightedComparables.length, 
      validComparables.length,
      corelogicAvm,
      fullCorelogicData,
      reinzData
    );
  }
  
  // Calculate data quality metrics
  const comparablesCount = validComparables.length;
  
  // Calculate what percentage of total comparables are considered valid
  const outlierPercentage = (weightedComparables.length - validComparables.length) / 
    weightedComparables.length;
  
  // Calculate average similarity score of valid comparables
  const avgSimilarityScore = validComparables.reduce(
    (sum, comp) => sum + comp.similarityScore, 0
  ) / validComparables.length;
  
  // Calculate average outlier score of valid comparables
  const avgOutlierScore = validComparables.reduce(
    (sum, comp) => sum + comp.outlierScore, 0
  ) / validComparables.length;
  
  // Calculate standard deviation of adjusted prices to measure consistency
  const adjustedPrices = validComparables.map(comp => comp.adjustedPrice!);
  const stdDev = calculateStandardDeviation(adjustedPrices);
  const meanPrice = calculateMean(adjustedPrices);
  const coeffOfVariation = stdDev / meanPrice; // Lower is better (more consistent)
  
  // Calculate data recency
  const currentDate = new Date();
  const saleDates = validComparables
    .filter(comp => comp.saleDate)
    .map(comp => new Date(comp.saleDate!));
  
  let dataRecencyScore = 0.5; // Default medium
  let mostRecentDays = 365; // Default to 1 year if no dates
  
  if (saleDates.length > 0) {
    // Find the most recent sale
    const mostRecentSale = new Date(Math.max(...saleDates.map(d => d.getTime())));
    const daysSinceMostRecent = Math.floor((currentDate.getTime() - mostRecentSale.getTime()) / 
      (1000 * 60 * 60 * 24));
    
    // Calculate average age of sales data in days
    const avgAgeDays = saleDates.reduce(
      (sum, date) => sum + Math.floor((currentDate.getTime() - date.getTime()) / 
        (1000 * 60 * 60 * 24)), 0
    ) / saleDates.length;
    
    // Recency score: 1.0 = very recent (within 30 days)
    // Gradually decrease to 0.0 for data older than 365 days
    dataRecencyScore = Math.min(1.0, Math.max(0.0, 1.0 - (avgAgeDays / 365)));
    mostRecentDays = daysSinceMostRecent;
  }
  
  // AVM data freshness (if available)
  let avmDataFreshness: number | undefined = undefined;
  let avmConfidenceScore = 0;
  
  if (fullCorelogicData?.avm_last_updated) {
    const avmUpdateDate = new Date(fullCorelogicData.avm_last_updated);
    avmDataFreshness = Math.floor((currentDate.getTime() - avmUpdateDate.getTime()) / 
      (1000 * 60 * 60 * 24));
    
    // AVM data less than 90 days old is considered fresh
    const avmFreshnessScore = Math.min(1.0, Math.max(0.0, 1.0 - (avmDataFreshness / 365)));
    
    // Combine AVM confidence with freshness
    avmConfidenceScore = corelogicAvm ? 
      (corelogicAvm.confidence * 0.7 + avmFreshnessScore * 0.3) : 
      0;
  } else if (corelogicAvm) {
    avmConfidenceScore = corelogicAvm.confidence;
  }
  
  // Calculate property complexity factor - how unique/difficult is it to value?
  const propertyComplexityFactors = [];
  
  // Check if property type is common or unique
  const commonTypes = ['house', 'apartment', 'unit', 'townhouse', 'flat'];
  const isCommonType = commonTypes.some(type => 
    propertyDetails.propertyType.toLowerCase().includes(type)
  );
  propertyComplexityFactors.push(isCommonType ? 0.2 : 0.8);
  
  // Check land size - very large properties are harder to value accurately
  if (propertyDetails.landSize) {
    const isLargeLand = propertyDetails.landSize > 2000; // 2000 m² threshold
    propertyComplexityFactors.push(isLargeLand ? 0.7 : 0.3);
  }
  
  // Check for unique features
  const hasUniqueFeatures = !!(
    propertyDetails.view === 'premium' || 
    propertyDetails.quality === 'premium' ||
    propertyDetails.architecturalStyle === 'unique' ||
    (propertyDetails.renovation_history?.renovation_quality === 'premium')
  );
  if (hasUniqueFeatures) {
    propertyComplexityFactors.push(0.8);
  }
  
  // Calculate average complexity (higher means more complex/unique = harder to value accurately)
  const propertyComplexityFactor = propertyComplexityFactors.length > 0 ?
    propertyComplexityFactors.reduce((sum, factor) => sum + factor, 0) / propertyComplexityFactors.length :
    0.5; // Default medium complexity
  
  // Market volatility factors (placeholder values - replace with actual market data)
  // These would ideally come from market statistics
  const volatilityScore = 0.4; // 0-1 where 1 is highly volatile
  const supplyDemandBalance = 0.5; // 0-1 where 0.5 is balanced
  const priceMovementSpeed = 0.3; // 0-1 where 1 is rapid price changes
  
  // Calculate data consistency score
  const dataConsistencyScore = Math.max(0, 1 - coeffOfVariation);
  
  // Calculate comparables relevance score
  const comparablesRelevanceScore = (
    avgSimilarityScore * 0.7 + // Higher similarity is better
    (1 - avgOutlierScore) * 0.3 // Lower outlier score is better
  );
  
  // Calculate final component scores
  const dataQualityScore = (
    (Math.min(1, comparablesCount / 10) * 0.4) + // More comparables is better (up to 10)
    ((1 - outlierPercentage) * 0.4) + // Fewer outliers is better
    (dataConsistencyScore * 0.2) // More consistent data is better
  );
  
  const statConsistencyScore = dataConsistencyScore;
  
  const marketVolatilityScore = 1 - (
    (volatilityScore * 0.5) + // Lower volatility is better
    (Math.abs(supplyDemandBalance - 0.5) * 0.3) + // Balanced market is better
    (priceMovementSpeed * 0.2) // Slower price movement is better
  );
  
  // Calculate overall confidence score
  const confidenceComponents = [
    dataQualityScore * 0.25,
    comparablesRelevanceScore * 0.25,
    dataRecencyScore * 0.15,
    statConsistencyScore * 0.15,
    marketVolatilityScore * 0.1
  ];
  
  // Include AVM confidence if available
  if (avmConfidenceScore > 0) {
    confidenceComponents.push(avmConfidenceScore * 0.1);
  }
  
  // Adjust for property complexity (unique properties are harder to value accurately)
  const baseConfidence = confidenceComponents.reduce((sum, score) => sum + score, 0);
  const adjustedConfidence = baseConfidence * (1 - (propertyComplexityFactor * 0.3));
  
  // Final confidence score (0-1)
  const confidenceScore = Math.min(1, Math.max(0, adjustedConfidence));
  
  return {
    confidenceScore,
    breakdown: {
      dataQuality: dataQualityScore,
      comparableRelevance: comparablesRelevanceScore,
      dataRecency: dataRecencyScore,
      statConsistency: statConsistencyScore,
      marketVolatility: marketVolatilityScore,
      avmConfidence: avmConfidenceScore,
      propertyComplexityFactor,
      dataQualities: {
        comparablesCount,
        comparablesRelevanceScore,
        mostRecentComparableDays: mostRecentDays,
        avmDataFreshness,
        outlierPercentage,
        dataConsistencyScore
      },
      marketFactors: {
        volatilityScore,
        supplyDemandBalance,
        priceMovementSpeed
      }
    }
  };
}

// Helper function to generate a low confidence result when data is limited
function generateLowConfidenceResult(
  totalComparables: number,
  validComparables: number,
  corelogicAvm: { confidence: number } | null,
  fullCorelogicData?: {
    avm_estimate?: number;
    avm_confidence?: string;
    property_id?: string;
    avm_last_updated?: string;
    confidence_score?: number;
  },
  reinzData?: {
    avm_estimate?: number;
    confidence_level?: string;
    last_updated?: string;
  }
): {
  confidenceScore: number;
  breakdown: {
    dataQuality: number;
    comparableRelevance: number;
    dataRecency: number;
    statConsistency: number;
    marketVolatility: number;
    avmConfidence: number;
    propertyComplexityFactor: number;
    dataQualities: {
      comparablesCount: number;
      comparablesRelevanceScore: number;
      mostRecentComparableDays: number;
      avmDataFreshness?: number;
      outlierPercentage: number;
      dataConsistencyScore: number;
    };
    marketFactors: {
      volatilityScore: number;
      supplyDemandBalance: number;
      priceMovementSpeed: number;
    };
  }
} {
  // If AVM data available, use its confidence; otherwise, very low confidence
  let confidenceScore = 0.2; // Default low confidence
  let avmConfidenceScore = 0;
  let avmDataFreshness = undefined;
  
  if (corelogicAvm) {
    avmConfidenceScore = corelogicAvm.confidence;
    confidenceScore = Math.max(confidenceScore, corelogicAvm.confidence * 0.7);
    
    if (fullCorelogicData?.avm_last_updated) {
      const currentDate = new Date();
      const avmUpdateDate = new Date(fullCorelogicData.avm_last_updated);
      // Fixed: Make avmDataFreshness nullable to match type definition
      avmDataFreshness = Math.floor((currentDate.getTime() - avmUpdateDate.getTime()) / 
        (1000 * 60 * 60 * 24)) || undefined;
    }
  }
  
  return {
    confidenceScore,
    breakdown: {
      dataQuality: validComparables / Math.max(1, totalComparables),
      comparableRelevance: 0.3,
      dataRecency: 0.3,
      statConsistency: 0.3,
      marketVolatility: 0.5,
      avmConfidence: avmConfidenceScore,
      propertyComplexityFactor: 0.5,
      dataQualities: {
        comparablesCount: validComparables,
        comparablesRelevanceScore: 0.3,
        mostRecentComparableDays: 365, // Default to 1 year
        avmDataFreshness,
        outlierPercentage: (totalComparables - validComparables) / Math.max(1, totalComparables),
        dataConsistencyScore: 0.3
      },
      marketFactors: {
        volatilityScore: 0.5,
        supplyDemandBalance: 0.5,
        priceMovementSpeed: 0.5
      }
    }
  };
}

// Map confidence score to category
function getConfidenceCategory(score: number): 'Very High' | 'High' | 'Moderate' | 'Low' {
  if (score >= 0.85) {
    return 'Very High';
  } else if (score >= 0.7) {
    return 'High';
  } else if (score >= 0.5) {
    return 'Moderate';
  } else {
    return 'Low';
  }
}

// Helper function to calculate enhanced market trends
function calculateEnhancedMarketTrends(
  comparables: Array<ComparableProperty & { 
    adjustedPrice?: number,
    weight?: number 
  }>,
  marketStatistics?: {
    corelogic?: Record<string, any>;
    reinz?: Record<string, any>;
  }
): {
  medianPrice: number;
  pricePerSqm: number;
  annualGrowth: number;
  // Added market trends
  quarterlyGrowth?: number;
  demandIndex?: number;
  supplyIndex?: number;
  daysOnMarket?: number;
  medianPriceChange?: {
    threeMonth: number;
    sixMonth: number;
    twelveMonth: number;
  };
  salesVolume?: {
    current: number;
    previousPeriod: number;
    yearAgo: number;
  };
  marketType?: 'Buyer' | 'Neutral' | 'Seller';
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
  
  // Enhanced growth rate calculation if we have dated sales
  let annualGrowth = 0.05; // Default
  let quarterlyGrowth;
  
  // Use CoreLogic/REINZ stats if available
  if (marketStatistics?.corelogic?.annualGrowth !== undefined) {
    annualGrowth = marketStatistics.corelogic.annualGrowth;
  } else if (marketStatistics?.reinz?.annualGrowth !== undefined) {
    annualGrowth = marketStatistics.reinz.annualGrowth;
  } else {
    // Try to calculate from comparable data
    const compsWithDates = comparables.filter(comp => comp.saleDate);
    
    if (compsWithDates.length >= 5) {
      // Sort by date
      compsWithDates.sort((a, b) => {
        return new Date(a.saleDate!).getTime() - new Date(b.saleDate!).getTime();
      });
      
      // Simple linear regression to estimate growth
      // Calculate average price for each month
      const pricesByMonth: Record<string, { sum: number, count: number }> = {};
      
      compsWithDates.forEach(comp => {
        const date = new Date(comp.saleDate!);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!pricesByMonth[monthKey]) {
          pricesByMonth[monthKey] = { sum: 0, count: 0 };
        }
        
        pricesByMonth[monthKey].sum += comp.adjustedPrice!;
        pricesByMonth[monthKey].count += 1;
      });
      
      // Convert to array of { month, avgPrice }
      const monthlyPrices = Object.entries(pricesByMonth).map(([key, value]) => {
        return {
          month: key,
          avgPrice: value.sum / value.count,
        };
      });
      
      if (monthlyPrices.length >= 2) {
        // Simple growth rate calculation from first to last month
        const firstMonth = monthlyPrices[0];
        const lastMonth = monthlyPrices[monthlyPrices.length - 1];
        
        const firstDate = new Date(firstMonth.month + "-01");
        const lastDate = new Date(lastMonth.month + "-01");
        
        const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                          (lastDate.getMonth() - firstDate.getMonth());
        
        if (monthsDiff > 0) {
          const priceChange = (lastMonth.avgPrice - firstMonth.avgPrice) / firstMonth.avgPrice;
          const monthlyGrowth = priceChange / monthsDiff;
          
          // Convert to annual growth
          annualGrowth = Math.pow(1 + monthlyGrowth, 12) - 1;
          
          // Calculate quarterly growth
          quarterlyGrowth = Math.pow(1 + monthlyGrowth, 3) - 1;
        }
      }
    }
  }
  
  // If we have CoreLogic quarterly growth but not calculated it ourselves
  if (quarterlyGrowth === undefined) {
    if (marketStatistics?.corelogic?.quarterlyGrowth !== undefined) {
      quarterlyGrowth = marketStatistics.corelogic.quarterlyGrowth;
    } else if (marketStatistics?.reinz?.quarterlyGrowth !== undefined) {
      quarterlyGrowth = marketStatistics.reinz.quarterlyGrowth;
    } else {
      // Estimate from annual growth
      quarterlyGrowth = Math.pow(1 + annualGrowth, 0.25) - 1;
    }
  }
  
  // Additional market trends from CoreLogic/REINZ data
  const result: {
    medianPrice: number;
    pricePerSqm: number;
    annualGrowth: number;
    quarterlyGrowth?: number;
    demandIndex?: number;
    supplyIndex?: number;
    daysOnMarket?: number;
    medianPriceChange?: {
      threeMonth: number;
      sixMonth: number;
      twelveMonth: number;
    };
    salesVolume?: {
      current: number;
      previousPeriod: number;
      yearAgo: number;
    };
    marketType?: 'Buyer' | 'Neutral' | 'Seller';
  } = {
    medianPrice: Math.round(medianPrice),
    pricePerSqm: Math.round(pricePerSqm),
    annualGrowth,
    quarterlyGrowth
  };
  
  // Add additional market data if available
  if (marketStatistics) {
    const stats = marketStatistics.corelogic || marketStatistics.reinz || {};
    
    // Demand-supply indices
    if (stats.demandIndex !== undefined) {
      result.demandIndex = stats.demandIndex;
    }
    
    if (stats.supplyIndex !== undefined) {
      result.supplyIndex = stats.supplyIndex;
    }
    
    // Days on market
    if (stats.daysOnMarket !== undefined) {
      result.daysOnMarket = stats.daysOnMarket;
    }
    
    // Price changes
    if (stats.medianPriceChange || stats.threeMonthChange || stats.sixMonthChange || stats.twelveMonthChange) {
      result.medianPriceChange = {
        threeMonth: stats.medianPriceChange?.threeMonth || stats.threeMonthChange || 0,
        sixMonth: stats.medianPriceChange?.sixMonth || stats.sixMonthChange || 0,
        twelveMonth: stats.medianPriceChange?.twelveMonth || stats.twelveMonthChange || annualGrowth
      };
    }
    
    // Sales volume
    if (stats.salesVolume || stats.currentSales || stats.previousSales || stats.yearAgoSales) {
      result.salesVolume = {
        current: stats.salesVolume?.current || stats.currentSales || 0,
        previousPeriod: stats.salesVolume?.previousPeriod || stats.previousSales || 0,
        yearAgo: stats.salesVolume?.yearAgo || stats.yearAgoSales || 0
      };
    }
    
    // Market type
    if (stats.marketType) {
      result.marketType = stats.marketType;
    } else if (stats.demandIndex !== undefined && stats.supplyIndex !== undefined) {
      // Determine market type from supply-demand balance
      const demandSupplyRatio = stats.demandIndex / stats.supplyIndex;
      
      if (demandSupplyRatio > 1.1) {
        result.marketType = 'Seller';
      } else if (demandSupplyRatio < 0.9) {
        result.marketType = 'Buyer';
      } else {
        result.marketType = 'Neutral';
      }
    } else if (annualGrowth > 0.08) {
      // Strong growth suggests seller's market
      result.marketType = 'Seller';
    } else if (annualGrowth < 0.02) {
      // Low/negative growth suggests buyer's market
      result.marketType = 'Buyer';
    } else {
      result.marketType = 'Neutral';
    }
  }
  
  return result;
}

// Main request handler
async function handleRequest(req: Request): Promise<Response> {
  // Log request received
  console.log(JSON.stringify({
    level: 'info',
    message: 'Valuation request received',
    method: req.method,
  }));

  // CORS headers for the response
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
    'Content-Type': 'application/json',
  };

  try {
    // Only handle POST requests for this endpoint
    if (req.method !== 'POST') {
      throw new Error('Method not allowed. Use POST.');
    }

    // Get the authenticated user (will be available because of the withAuth middleware)
    const authUser = getAuthUser(req);
    if (!authUser) {
      throw new Error('User authentication failed');
    }

    // Log the authenticated user
    console.log(JSON.stringify({
      level: 'info',
      message: 'Processing valuation request for user',
      userId: authUser.userId,
      userRole: authUser.userRole || 'no role'
    }));

    // Parse the request body
    const requestData: ValuationRequest = await req.json();
    
    // Validate the request
    if (!requestData.appraisalId) {
      return new Response(
        JSON.stringify({ error: 'Appraisal ID is required' }),
        { 
          status: 400, 
          headers: { ...headers } 
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
        headers: { ...headers } 
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

// Update the serve call to use both middlewares
serve(
  withCsrfProtection(
    withAuth(handleRequest, { 
      requireAuth: true,
      // Optionally restrict to specific roles if needed
      // allowedRoles: ['admin', 'agent']
    }), 
    { enforceForMutations: true }
  )
) 

// Helper functions
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  } else {
    return sorted[middle];
  }
}

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  
  const mean = calculateMean(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}