/**
 * Advanced Outlier Detection for Property Valuation
 * 
 * This module provides enhanced outlier detection methods for property valuations,
 * including context-aware outlier detection that considers property attributes.
 */

import { 
  detectOutliersModifiedZ, 
  detectOutliersChauvenets, 
  interquartileRange,
  coefficientOfVariation 
} from './stats-utils';
import { 
  EnhancedComparableProperty, 
  EnhancedPropertyDetails 
} from './valuation-types';

/**
 * Options for advanced outlier detection
 */
interface OutlierDetectionOptions {
  method?: 'IQR' | 'ModifiedZ' | 'Chauvenets' | 'Combined';
  threshold?: number; // For ModifiedZ
  sensitivityFactor?: number; // 0-2, 1 is default, higher means more sensitive
  considerPropertyAttributes?: boolean; // Whether to use property attributes in context
}

/**
 * Detect outliers using the traditional IQR method
 * 
 * @param comparables Array of comparable properties
 * @param sensitivityFactor Factor to adjust IQR range (default 1.5)
 * @returns Comparables with outlier scores
 */
export function detectOutliersIQR(
  comparables: EnhancedComparableProperty[],
  sensitivityFactor = 1.5
): EnhancedComparableProperty[] {
  // Extract sale prices
  const prices = comparables
    .filter(comp => comp.salePrice !== null && comp.salePrice !== undefined)
    .map(comp => comp.salePrice!);
  
  if (prices.length < 4) {
    // Not enough data for IQR method
    return comparables.map(comp => ({
      ...comp,
      outlierScore: 0,
      outlierMethod: 'None'
    }));
  }
  
  // Calculate IQR
  const { q1, q3, iqr } = interquartileRange(prices);
  
  // Calculate bounds
  const lowerBound = q1 - (iqr * sensitivityFactor);
  const upperBound = q3 + (iqr * sensitivityFactor);
  
  // Calculate range width for scaling outlier scores
  const rangeWidth = upperBound - lowerBound;
  
  // Calculate outlier scores
  return comparables.map(comp => {
    if (comp.salePrice === null || comp.salePrice === undefined) {
      return { ...comp, outlierScore: 0, outlierMethod: 'None' };
    }
    
    let outlierScore = 0;
    
    if (comp.salePrice < lowerBound) {
      // Calculate how far below the bound this price is, normalized by range width
      outlierScore = Math.min(1, (lowerBound - comp.salePrice) / (rangeWidth / 2));
    } else if (comp.salePrice > upperBound) {
      // Calculate how far above the bound this price is, normalized by range width
      outlierScore = Math.min(1, (comp.salePrice - upperBound) / (rangeWidth / 2));
    }
    
    return {
      ...comp,
      outlierScore,
      outlierMethod: outlierScore > 0 ? 'IQR' : 'None'
    };
  });
}

/**
 * Detect outliers using the Modified Z-score method
 * 
 * @param comparables Array of comparable properties
 * @param threshold Z-score threshold (default 3.5)
 * @returns Comparables with outlier scores
 */
export function detectOutliersModifiedZScore(
  comparables: EnhancedComparableProperty[],
  threshold = 3.5
): EnhancedComparableProperty[] {
  // Extract sale prices
  const prices = comparables
    .filter(comp => comp.salePrice !== null && comp.salePrice !== undefined)
    .map(comp => comp.salePrice!);
  
  if (prices.length < 4) {
    // Not enough data for Z-score method
    return comparables.map(comp => ({
      ...comp,
      outlierScore: 0,
      outlierMethod: 'None'
    }));
  }
  
  // Get modified Z-scores
  const { scores } = detectOutliersModifiedZ(prices, threshold);
  
  // Map scores back to comparables
  let scoreIndex = 0;
  return comparables.map(comp => {
    if (comp.salePrice === null || comp.salePrice === undefined) {
      return { ...comp, outlierScore: 0, outlierMethod: 'None' };
    }
    
    const zScore = Math.abs(scores[scoreIndex++]);
    // Calculate outlier score as a ratio of the Z-score to the threshold
    const outlierScore = zScore > threshold ? Math.min(1, (zScore - threshold) / threshold) : 0;
    
    return {
      ...comp,
      outlierScore,
      outlierMethod: outlierScore > 0 ? 'ModifiedZ' : 'None'
    };
  });
}

/**
 * Detect outliers using Chauvenet's criterion
 * 
 * @param comparables Array of comparable properties
 * @returns Comparables with outlier scores
 */
export function detectOutliersChauvenetsMethod(
  comparables: EnhancedComparableProperty[]
): EnhancedComparableProperty[] {
  // Extract sale prices
  const prices = comparables
    .filter(comp => comp.salePrice !== null && comp.salePrice !== undefined)
    .map(comp => comp.salePrice!);
  
  if (prices.length < 4) {
    // Not enough data for Chauvenet's method
    return comparables.map(comp => ({
      ...comp,
      outlierScore: 0,
      outlierMethod: 'None'
    }));
  }
  
  // Apply Chauvenet's criterion
  const { probabilities } = detectOutliersChauvenets(prices);
  
  // Calculate threshold
  const threshold = 1 / (2 * prices.length);
  
  // Map probabilities back to comparables
  let probIndex = 0;
  return comparables.map(comp => {
    if (comp.salePrice === null || comp.salePrice === undefined) {
      return { ...comp, outlierScore: 0, outlierMethod: 'None' };
    }
    
    const probability = probabilities[probIndex++];
    // Lower probability means more likely to be an outlier
    // Normalize to 0-1 outlier score
    const outlierScore = probability < threshold ? 
      Math.min(1, (threshold - probability) / threshold) : 0;
    
    return {
      ...comp,
      outlierScore,
      outlierMethod: outlierScore > 0 ? 'Chauvenets' : 'None'
    };
  });
}

/**
 * Context-aware outlier detection that considers property attributes
 * 
 * @param comparables Array of comparable properties
 * @param targetProperty The subject property details
 * @returns Comparables with outlier scores adjusted for context
 */
export function contextAwareOutlierDetection(
  comparables: EnhancedComparableProperty[],
  targetProperty: EnhancedPropertyDetails
): EnhancedComparableProperty[] {
  // Group comparables by similar attributes
  const groups: {[key: string]: EnhancedComparableProperty[]} = {};
  
  // Create logical groupings based on property type and size
  comparables.forEach(comp => {
    // Skip comparables without sale price
    if (comp.salePrice === null || comp.salePrice === undefined) return;
    
    // Create a category key
    const bedroomGroup = comp.bedrooms ? Math.min(5, Math.max(1, comp.bedrooms)) : 'unknown';
    const typeGroup = comp.propertyType || 'unknown';
    const sizeGroup = comp.landSize ? 
      (comp.landSize < 500 ? 'small' : comp.landSize < 1000 ? 'medium' : 'large') : 'unknown';
    
    const key = `${typeGroup}-${bedroomGroup}-${sizeGroup}`;
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(comp);
  });
  
  // Find the group that matches the target property
  const targetBedroomGroup = targetProperty.bedrooms ? 
    Math.min(5, Math.max(1, targetProperty.bedrooms)) : 'unknown';
  const targetTypeGroup = targetProperty.propertyType || 'unknown';
  const targetSizeGroup = targetProperty.landSize ? 
    (targetProperty.landSize < 500 ? 'small' : targetProperty.landSize < 1000 ? 'medium' : 'large') : 'unknown';
  
  const targetKey = `${targetTypeGroup}-${targetBedroomGroup}-${targetSizeGroup}`;
  
  // Apply IQR method to each group separately, with different sensitivity
  const result: EnhancedComparableProperty[] = [];
  
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    
    // Apply stricter outlier detection to groups that don't match the target
    const sensitivityFactor = key === targetKey ? 1.5 : 1.2;
    
    // Apply IQR method to this group
    const groupWithOutlierScores = detectOutliersIQR(group, sensitivityFactor);
    
    // If this is the target group, reduce outlier scores slightly
    if (key === targetKey) {
      groupWithOutlierScores.forEach(comp => {
        comp.outlierScore = Math.max(0, comp.outlierScore - 0.1);
      });
    }
    
    result.push(...groupWithOutlierScores);
  });
  
  return result;
}

/**
 * Combined outlier detection using multiple methods
 * 
 * @param comparables Array of comparable properties
 * @param targetProperty The subject property details
 * @param options Outlier detection options
 * @returns Comparables with consolidated outlier scores
 */
export function detectOutliers(
  comparables: EnhancedComparableProperty[],
  targetProperty: EnhancedPropertyDetails,
  options: OutlierDetectionOptions = {}
): EnhancedComparableProperty[] {
  const {
    method = 'Combined',
    threshold = 3.5,
    sensitivityFactor = 1.0,
    considerPropertyAttributes = true
  } = options;
  
  // Apply primary outlier detection based on specified method
  let result: EnhancedComparableProperty[];
  
  switch (method) {
    case 'IQR':
      result = detectOutliersIQR(comparables, sensitivityFactor * 1.5);
      break;
    case 'ModifiedZ':
      result = detectOutliersModifiedZScore(comparables, threshold);
      break;
    case 'Chauvenets':
      result = detectOutliersChauvenetsMethod(comparables);
      break;
    case 'Combined':
    default:
      // Apply all methods and combine the results
      const iqrResults = detectOutliersIQR(comparables, sensitivityFactor * 1.5);
      const zResults = detectOutliersModifiedZScore(comparables, threshold);
      const chauvResults = detectOutliersChauvenetsMethod(comparables);
      
      // Combine outlier scores, using max of all methods
      result = comparables.map((comp, i) => {
        const iqrScore = iqrResults[i].outlierScore || 0;
        const zScore = zResults[i].outlierScore || 0;
        const chauvScore = chauvResults[i].outlierScore || 0;
        
        // Take the maximum score from any method
        const maxScore = Math.max(iqrScore, zScore, chauvScore);
        
        // Determine which method produced this score
        let method = 'None';
        if (maxScore > 0) {
          if (maxScore === iqrScore) method = 'IQR';
          else if (maxScore === zScore) method = 'ModifiedZ';
          else if (maxScore === chauvScore) method = 'Chauvenets';
        }
        
        return {
          ...comp,
          outlierScore: maxScore,
          outlierMethod: method
        };
      });
      break;
  }
  
  // Apply context-aware adjustments if requested
  if (considerPropertyAttributes) {
    const contextResults = contextAwareOutlierDetection(result, targetProperty);
    
    // Blend context-aware results with primary results
    result = result.map((comp, i) => {
      const contextScore = contextResults[i].outlierScore || 0;
      const primaryScore = comp.outlierScore || 0;
      
      // Weighted average, giving more weight to context for combined method
      const weight = method === 'Combined' ? 0.7 : 0.5;
      const blendedScore = (primaryScore * (1 - weight)) + (contextScore * weight);
      
      return {
        ...comp,
        outlierScore: blendedScore,
        outlierMethod: blendedScore > 0 ? 
          (comp.outlierMethod === 'None' ? contextResults[i].outlierMethod : comp.outlierMethod) : 
          'None'
      };
    });
  }
  
  return result;
} 