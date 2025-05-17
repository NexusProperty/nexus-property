/**
 * Enhanced Price Adjustment Calculations for Property Valuation
 * 
 * This module provides advanced price adjustment functions that consider
 * additional property attributes and market factors.
 */

import { 
  EnhancedComparableProperty, 
  EnhancedPropertyDetails,
  MarketStatistics,
  AdjustmentFactors
} from './valuation-types';

/**
 * Options for price adjustment calculations
 */
interface PriceAdjustmentOptions {
  considerCondition?: boolean;
  considerArchitecturalStyle?: boolean;
  considerConstructionMaterials?: boolean;
  considerLocationFactors?: boolean;
  considerMarketTrends?: boolean;
  seasonalAdjustment?: boolean;
}

/**
 * Quality mapping for condition values
 */
const CONDITION_QUALITY: {[key: string]: number} = {
  'Excellent': 1.0,
  'Very Good': 0.9,
  'Good': 0.8,
  'Average': 0.7,
  'Fair': 0.6,
  'Poor': 0.5,
  'Very Poor': 0.4,
  'Derelict': 0.3
};

/**
 * Calculate adjusted prices for each comparable property
 * 
 * @param comparables Array of comparable properties
 * @param propertyDetails Target property details
 * @param marketStats Market statistics (optional)
 * @param options Price adjustment options
 * @returns Comparables with adjustment factors and adjusted prices
 */
export function calculateAdjustedPrices(
  comparables: EnhancedComparableProperty[],
  propertyDetails: EnhancedPropertyDetails,
  marketStats?: MarketStatistics,
  options: PriceAdjustmentOptions = {}
): {
  adjustedComparables: EnhancedComparableProperty[],
  adjustmentFactors: AdjustmentFactors
} {
  const {
    considerCondition = true,
    considerArchitecturalStyle = true,
    considerConstructionMaterials = true,
    considerLocationFactors = true,
    considerMarketTrends = true,
    seasonalAdjustment = true
  } = options;
  
  // Store adjustment factors for explanation
  const adjustmentFactors: AdjustmentFactors = {};
  
  // Calculate adjusted prices for each comparable
  const adjustedComparables = comparables.map(comp => {
    // Skip if no sale price
    if (comp.salePrice === null || comp.salePrice === undefined) {
      return {
        ...comp,
        adjustmentFactor: 1.0,
        adjustedPrice: comp.salePrice
      };
    }
    
    let adjustmentFactor = 1.0;
    
    // --- Basic property attributes ---
    
    // Adjust for bedrooms difference
    if (comp.bedrooms !== undefined && propertyDetails.bedrooms !== undefined) {
      const bedroomDiff = propertyDetails.bedrooms - comp.bedrooms;
      // Use a diminishing scale for bedroom adjustments
      // First bedroom worth more than subsequent ones
      let bedroomAdjustment = 0;
      if (bedroomDiff > 0) {
        // Adding bedrooms (1st = 5%, 2nd = 4%, 3rd+ = 3%)
        for (let i = 1; i <= bedroomDiff; i++) {
          bedroomAdjustment += i === 1 ? 0.05 : i === 2 ? 0.04 : 0.03;
        }
      } else if (bedroomDiff < 0) {
        // Removing bedrooms (1st = -5%, 2nd = -4%, 3rd+ = -3%)
        for (let i = 1; i <= Math.abs(bedroomDiff); i++) {
          bedroomAdjustment -= i === 1 ? 0.05 : i === 2 ? 0.04 : 0.03;
        }
      }
      
      adjustmentFactor += bedroomAdjustment;
      adjustmentFactors.bedroomValue = (comp.salePrice * bedroomAdjustment) / bedroomDiff;
    }
    
    // Adjust for bathrooms difference
    if (comp.bathrooms !== undefined && propertyDetails.bathrooms !== undefined) {
      const bathroomDiff = propertyDetails.bathrooms - comp.bathrooms;
      // Bathrooms typically worth 3-4% of property value
      const bathroomAdjustment = bathroomDiff * 0.035;
      adjustmentFactor += bathroomAdjustment;
      adjustmentFactors.bathroomValue = (comp.salePrice * 0.035);
    }
    
    // Adjust for land size difference
    if (comp.landSize !== undefined && propertyDetails.landSize !== undefined && comp.landSize > 0) {
      const landSizeDiff = (propertyDetails.landSize / comp.landSize) - 1;
      // Land size adjustment varies by property type
      let landSizeFactor = 0.1; // Default: 10% for land size ratio
      
      // Different impact on different property types
      if (propertyDetails.propertyType && comp.propertyType === propertyDetails.propertyType) {
        if (propertyDetails.propertyType.toLowerCase().includes('apartment')) {
          landSizeFactor = 0.05; // Less impact for apartments
        } else if (propertyDetails.propertyType.toLowerCase().includes('land') || 
                  propertyDetails.propertyType.toLowerCase().includes('section')) {
          landSizeFactor = 0.8; // Much higher impact for land
        } else if (propertyDetails.propertyType.toLowerCase().includes('house')) {
          landSizeFactor = 0.15; // Higher impact for houses
        }
      }
      
      const landSizeAdjustment = landSizeDiff * landSizeFactor;
      adjustmentFactor += landSizeAdjustment;
      adjustmentFactors.landSizeValue = comp.landSize > 0 ? 
        (comp.salePrice * landSizeFactor / comp.landSize) : 0;
    }
    
    // Adjust for floor area difference
    if (comp.floorArea !== undefined && propertyDetails.floorArea !== undefined && comp.floorArea > 0) {
      const floorAreaDiff = (propertyDetails.floorArea / comp.floorArea) - 1;
      // Floor area adjustment varies by property type
      let floorAreaFactor = 0.15; // Default: 15% factor for floor area ratio
      
      // Different impact on different property types
      if (propertyDetails.propertyType && comp.propertyType === propertyDetails.propertyType) {
        if (propertyDetails.propertyType.toLowerCase().includes('apartment')) {
          floorAreaFactor = 0.25; // Higher impact for apartments
        } else if (propertyDetails.propertyType.toLowerCase().includes('land')) {
          floorAreaFactor = 0.01; // Minimal impact for land
        }
      }
      
      const floorAreaAdjustment = floorAreaDiff * floorAreaFactor;
      adjustmentFactor += floorAreaAdjustment;
      adjustmentFactors.floorAreaValue = comp.floorArea > 0 ? 
        (comp.salePrice * floorAreaFactor / comp.floorArea) : 0;
    }
    
    // --- Extended property attributes ---
    
    // Adjust for car spaces
    if (considerCondition && 
        comp.carSpaces !== undefined && propertyDetails.carSpaces !== undefined) {
      const carSpaceDiff = propertyDetails.carSpaces - comp.carSpaces;
      // Typically 2-3% per car space
      const carSpaceValue = 0.025;
      const carSpaceAdjustment = carSpaceDiff * carSpaceValue;
      
      adjustmentFactor += carSpaceAdjustment;
      adjustmentFactors.carSpaceValue = comp.salePrice * carSpaceValue;
    }
    
    // Adjust for condition
    if (considerCondition && 
        comp.condition !== undefined && propertyDetails.condition !== undefined) {
      const compConditionScore = CONDITION_QUALITY[comp.condition] || 0.7;
      const propConditionScore = CONDITION_QUALITY[propertyDetails.condition] || 0.7;
      
      // Condition can have a significant impact (up to 15-20%)
      const conditionDiff = propConditionScore - compConditionScore;
      const conditionAdjustment = conditionDiff * 0.2;
      
      adjustmentFactor += conditionAdjustment;
      adjustmentFactors.conditionFactor = conditionDiff > 0 ? 
        (comp.salePrice * conditionAdjustment / conditionDiff) : 0;
    }
    
    // Adjust for architectural style
    if (considerArchitecturalStyle && 
        comp.architecturalStyle !== undefined && propertyDetails.architecturalStyle !== undefined) {
      // Apply small adjustment (1-3%) if styles don't match
      // Premium styles command higher prices
      const premiumStyles = ['Character', 'Heritage', 'Architect Designed'];
      
      const compIsPremium = premiumStyles.some(
        style => comp.architecturalStyle?.includes(style)
      );
      const propIsPremium = premiumStyles.some(
        style => propertyDetails.architecturalStyle?.includes(style)
      );
      
      if (propIsPremium && !compIsPremium) {
        // Property has premium style, comparable doesn't
        adjustmentFactor += 0.03;
      } else if (!propIsPremium && compIsPremium) {
        // Comparable has premium style, property doesn't
        adjustmentFactor -= 0.03;
      }
      
      adjustmentFactors.architecturalStyleFactor = propIsPremium ? 0.03 : 0;
    }
    
    // Adjust for construction materials
    if (considerConstructionMaterials && 
        comp.constructionMaterials && propertyDetails.constructionMaterials) {
      const premiumMaterials = ['Brick', 'Stone', 'Concrete', 'Solid'];
      
      // Check walls
      if (comp.constructionMaterials.walls && propertyDetails.constructionMaterials.walls) {
        const compWallsPremium = premiumMaterials.some(
          mat => comp.constructionMaterials?.walls?.includes(mat)
        );
        const propWallsPremium = premiumMaterials.some(
          mat => propertyDetails.constructionMaterials?.walls?.includes(mat)
        );
        
        if (propWallsPremium && !compWallsPremium) {
          // Property has premium walls, comparable doesn't
          adjustmentFactor += 0.02;
        } else if (!propWallsPremium && compWallsPremium) {
          // Comparable has premium walls, property doesn't
          adjustmentFactor -= 0.02;
        }
      }
      
      // Similar checks could be done for roof and floors
    }
    
    // Adjust for age/year built
    if (comp.yearBuilt !== undefined && propertyDetails.yearBuilt !== undefined) {
      const ageDiff = propertyDetails.yearBuilt - comp.yearBuilt;
      // Non-linear adjustment: newer houses generally command premium,
      // but very old (character) houses can also command premium
      let ageAdjustment = 0;
      
      if (propertyDetails.yearBuilt >= 2010) {
        // Modern house (last ~10 years)
        if (comp.yearBuilt < 2010) {
          // Comparable is older
          ageAdjustment = Math.min(0.10, (propertyDetails.yearBuilt - comp.yearBuilt) * 0.005);
        }
      } else if (propertyDetails.yearBuilt >= 1990) {
        // Recent house (10-30 years)
        if (comp.yearBuilt < 1990) {
          // Comparable is older
          ageAdjustment = Math.min(0.05, (propertyDetails.yearBuilt - comp.yearBuilt) * 0.002);
        } else if (comp.yearBuilt >= 2010) {
          // Comparable is newer
          ageAdjustment = Math.max(-0.10, (propertyDetails.yearBuilt - comp.yearBuilt) * 0.005);
        }
      } else if (propertyDetails.yearBuilt < 1950) {
        // Character house
        if (comp.yearBuilt >= 1950 && comp.yearBuilt < 2000) {
          // Comparable is mid-century (often less desirable)
          ageAdjustment = 0.05;
        } else if (comp.yearBuilt >= 2000) {
          // Comparable is modern (different market)
          ageAdjustment = 0.0; // Neutral, different buyers
        }
      } else {
        // Standard age adjustment
        ageAdjustment = ageDiff * 0.003; // 0.3% per year
      }
      
      adjustmentFactor += ageAdjustment;
      adjustmentFactors.ageAdjustment = ageAdjustment > 0 ? 
        (comp.salePrice * ageAdjustment / Math.max(1, Math.abs(ageDiff))) : 0;
    }
    
    // Adjust for property type
    if (comp.propertyType !== propertyDetails.propertyType) {
      // Different property types often target different markets
      // Apply a significant adjustment (10-15%)
      adjustmentFactor *= 0.9; // 10% reduction for different property type
    }
    
    // --- Market and location factors ---
    
    // Adjust for recency of sale
    if (comp.saleDate) {
      const saleDate = new Date(comp.saleDate);
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - saleDate.getFullYear()) * 12 + 
                        (currentDate.getMonth() - saleDate.getMonth());
      
      // Use market statistics for growth rate if available
      let monthlyGrowthRate = 0.004; // Default: ~5% annual growth
      
      if (considerMarketTrends && marketStats) {
        // Use market stats for more accurate growth rate
        // Convert annual growth rate to monthly
        monthlyGrowthRate = Math.pow(1 + marketStats.annualGrowth, 1/12) - 1;
      }
      
      const growthAdjustment = monthsDiff * monthlyGrowthRate;
      adjustmentFactor += growthAdjustment;
      
      // Seasonal adjustment
      if (seasonalAdjustment) {
        const saleMonth = saleDate.getMonth();
        const currentMonth = currentDate.getMonth();
        
        // Simple seasonal adjustment
        // Peak season: Oct-Feb (Southern Hemisphere spring/summer)
        // Low season: May-Aug (Southern Hemisphere winter)
        const seasonalFactors = [
          0.01,   // Jan - Peak
          0.01,   // Feb - Peak
          0.0,    // Mar - Shoulder
          -0.01,  // Apr - Shoulder
          -0.02,  // May - Low
          -0.03,  // Jun - Low
          -0.03,  // Jul - Low
          -0.02,  // Aug - Low
          -0.01,  // Sep - Shoulder
          0.01,   // Oct - Peak
          0.02,   // Nov - Peak
          0.02    // Dec - Peak
        ];
        
        // Adjust for seasonal difference between sale date and current date
        const seasonalAdjustment = seasonalFactors[currentMonth] - seasonalFactors[saleMonth];
        adjustmentFactor += seasonalAdjustment;
        adjustmentFactors.seasonalFactor = seasonalAdjustment;
      }
      
      adjustmentFactors.marketTrendFactor = growthAdjustment;
    }
    
    // Adjust for location
    if (considerLocationFactors) {
      // Location adjustment based on suburb/city
      if (comp.suburb !== propertyDetails.suburb) {
        // Different suburb - apply adjustment based on median prices if available
        if (marketStats && marketStats.suburb === propertyDetails.suburb) {
          // We have market stats for the property's suburb
          // Now we need market stats for the comparable's suburb
          // This would typically come from a suburb price database
          // For now, use a simplified approach
          adjustmentFactor *= 0.95; // 5% penalty for different suburb
        } else {
          adjustmentFactor *= 0.95; // Default 5% penalty
        }
      }
      
      // For different cities, the adjustment would be larger
      if (comp.city !== propertyDetails.city) {
        adjustmentFactor *= 0.9; // 10% penalty for different city
      }
      
      adjustmentFactors.locationFactor = comp.suburb !== propertyDetails.suburb ? 0.05 : 0;
    }
    
    // Calculate adjusted price
    const adjustedPrice = comp.salePrice * adjustmentFactor;
    
    return {
      ...comp,
      adjustmentFactor,
      adjustedPrice
    };
  });
  
  return {
    adjustedComparables,
    adjustmentFactors
  };
} 