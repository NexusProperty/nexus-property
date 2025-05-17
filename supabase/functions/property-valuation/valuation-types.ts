/**
 * Type definitions for the enhanced property valuation algorithm
 */

/**
 * CoreLogic Automated Valuation Model (AVM) data
 */
export interface CoreLogicAVMData {
  propertyId: string;
  valuationDate: string;
  valuationLow: number;
  valuationHigh: number;
  valuationEstimate: number;
  confidenceScore: number; // 0-1
  forecastAnnualGrowth?: number;
  methodology?: string;
}

/**
 * REINZ AVM data
 */
export interface REINZAVMData {
  propertyId: string;
  valuationDate: string;
  valuationEstimate: number;
  confidenceLevel?: string; // e.g., "High", "Medium", "Low"
}

/**
 * Market statistics from CoreLogic and REINZ
 */
export interface MarketStatistics {
  suburb: string;
  city: string;
  medianPrice: number;
  medianPriceLastQuarter?: number;
  medianPriceLastYear?: number;
  quarterlyGrowth?: number;
  annualGrowth: number;
  fiveYearGrowth?: number;
  salesVolume: number;
  salesVolumeYoY?: number;
  daysOnMarket: number;
  listingCount?: number;
  medianRent?: number;
  rentalYield?: number;
  source: 'CoreLogic' | 'REINZ' | 'Combined';
}

/**
 * Extended PropertyDetails with additional CoreLogic attributes
 */
export interface EnhancedPropertyDetails {
  address: string;
  suburb: string;
  city: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  landSize?: number;
  floorArea?: number;
  yearBuilt?: number;
  // Additional attributes from CoreLogic
  carSpaces?: number;
  propertyClass?: string; // e.g., "Residential", "Commercial"
  zoning?: string;
  isStrata?: boolean;
  constructionMaterials?: {
    walls?: string;
    roof?: string;
    floors?: string;
  };
  condition?: string; // e.g., "Excellent", "Good", "Average", "Poor"
  architecturalStyle?: string;
  features?: string[];
  views?: string[];
  renovations?: {
    year?: number;
    description?: string;
  }[];
}

/**
 * Enhanced ComparableProperty with additional attributes and
 * graduated outlier scoring instead of binary outlier flag
 */
export interface EnhancedComparableProperty {
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
  // Extended attributes
  carSpaces?: number;
  condition?: string;
  architecturalStyle?: string;
  constructionMaterials?: {
    walls?: string;
    roof?: string;
  };
  zoning?: string;
  features?: string[];
  // Analysis fields
  adjustedPrice?: number;
  adjustmentFactor?: number;
  weight?: number;
  outlierScore?: number; // 0-1, higher means more likely an outlier
  outlierMethod?: string; // Which method flagged this as an outlier
}

/**
 * Price adjustment factors
 */
export interface AdjustmentFactors {
  bedroomValue?: number;
  bathroomValue?: number;
  landSizeValue?: number;
  floorAreaValue?: number;
  carSpaceValue?: number;
  locationFactor?: number;
  ageAdjustment?: number;
  conditionFactor?: number;
  architecturalStyleFactor?: number;
  seasonalFactor?: number;
  marketTrendFactor?: number;
}

/**
 * Extended ValuationRequest interface that includes CoreLogic and REINZ data
 */
export interface EnhancedValuationRequest {
  appraisalId: string;
  propertyDetails: EnhancedPropertyDetails;
  comparableProperties: EnhancedComparableProperty[];
  // CoreLogic and REINZ data
  corelogicAVM?: CoreLogicAVMData;
  reinzAVM?: REINZAVMData;
  marketStatistics?: MarketStatistics;
  // Configuration options
  options?: {
    useAVM: boolean;
    avmWeight?: number; // 0-1, how much weight to give AVM vs comparables
    outlierMethod?: 'IQR' | 'ModifiedZ' | 'Chauvenets' | 'Combined';
    confidenceThreshold?: number; // 0-1, minimum confidence to use an estimate
  };
}

/**
 * Confidence breakdown details for enhanced transparency
 */
export interface ConfidenceBreakdown {
  overall: number; // 0-1
  level: 'Very High' | 'High' | 'Moderate' | 'Low' | 'Very Low';
  factors: {
    dataQuality: number; // 0-1
    comparableCount: number; // 0-1
    comparableSimilarity: number; // 0-1
    outlierImpact: number; // 0-1
    dataRecency: number; // 0-1
    marketVolatility: number; // 0-1
    avmConfidence?: number; // 0-1
  };
}

/**
 * Enhanced market analysis
 */
export interface MarketAnalysis {
  medianPrice: number;
  pricePerSqm: number;
  annualGrowth: number;
  quarterlyGrowth?: number;
  salesVolume: number;
  daysOnMarket: number;
  marketStrength?: 'Buyer' | 'Neutral' | 'Seller';
  pricePerformance?: {
    threeMonth: number;
    sixMonth: number;
    oneYear: number;
    fiveYear?: number;
  };
  seasonalTrend?: number; // Adjustment for time of year
  forecastGrowth?: number; // Predicted growth for next 12 months
}

/**
 * Detailed valuation response with blend information
 */
export interface EnhancedValuationResult {
  success: boolean;
  error?: string;
  data?: {
    valuationLow: number;
    valuationHigh: number;
    valuationEstimate: number;
    valuationConfidence: number; // 0-1
    confidenceBreakdown: ConfidenceBreakdown;
    valuationApproach: {
      method: 'Comparable' | 'AVM' | 'Hybrid';
      avmWeight?: number; // 0-1, if hybrid
      comparableWeight?: number; // 0-1, if hybrid
      avmConfidence?: number; // 0-1, if AVM was used
    };
    adjustedComparables: Array<{
      id: string;
      address: string;
      salePrice: number;
      adjustedPrice: number;
      adjustmentFactor: number;
      weight: number;
      outlierScore: number;
      isExcluded: boolean;
    }>;
    valuationFactors: AdjustmentFactors;
    marketAnalysis: MarketAnalysis;
  };
} 