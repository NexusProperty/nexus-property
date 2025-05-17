/**
 * Statistical Utilities for Enhanced Property Valuation
 * 
 * This module provides advanced statistical functions used in property valuation,
 * including improved outlier detection, confidence scoring, and statistical 
 * calculations for price adjustments.
 */

/**
 * Calculate median value of an array of numbers
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sortedValues = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sortedValues.length / 2);
  
  return sortedValues.length % 2 !== 0
    ? sortedValues[mid]
    : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
}

/**
 * Calculate mean (average) value of an array of numbers
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation of an array of numbers
 */
export function standardDeviation(values: number[], useSample = false): number {
  if (values.length <= 1) return 0;
  
  const avg = mean(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / 
                  (useSample ? values.length - 1 : values.length);
  
  return Math.sqrt(variance);
}

/**
 * Calculate the median absolute deviation (MAD)
 * Used in the modified Z-score method for outlier detection
 */
export function medianAbsoluteDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const med = median(values);
  const absoluteDeviations = values.map(value => Math.abs(value - med));
  
  return median(absoluteDeviations);
}

/**
 * Calculate modified Z-scores for an array of values
 * This is more robust for outlier detection than standard Z-scores
 * A modified Z-score with absolute value > 3.5 is generally considered an outlier
 * 
 * @param values Array of numeric values
 * @returns Array of modified Z-scores corresponding to input values
 */
export function modifiedZScores(values: number[]): number[] {
  if (values.length === 0) return [];
  
  const med = median(values);
  const mad = medianAbsoluteDeviation(values);
  
  // If MAD is 0, return zeros (all values are identical)
  if (mad === 0) return values.map(() => 0);
  
  // Constant 0.6745 is used to make the MAD comparable to standard deviation for normal distributions
  return values.map(value => 0.6745 * (value - med) / mad);
}

/**
 * Detect outliers using the modified Z-score method
 * 
 * @param values Array of numeric values
 * @param threshold Modified Z-score threshold (default 3.5)
 * @returns Object containing outlier indices, non-outlier indices, and modified Z-scores
 */
export function detectOutliersModifiedZ(
  values: number[],
  threshold = 3.5
): {
  outlierIndices: number[];
  nonOutlierIndices: number[];
  scores: number[];
} {
  const scores = modifiedZScores(values);
  const outlierIndices = scores
    .map((score, index) => Math.abs(score) > threshold ? index : -1)
    .filter(index => index !== -1);
  
  const nonOutlierIndices = values
    .map((_, index) => outlierIndices.includes(index) ? -1 : index)
    .filter(index => index !== -1);
  
  return {
    outlierIndices,
    nonOutlierIndices,
    scores
  };
}

/**
 * Calculate interquartile range (IQR) for an array of numbers
 */
export function interquartileRange(values: number[]): {
  q1: number;
  q3: number;
  iqr: number;
} {
  if (values.length < 4) {
    return { q1: 0, q3: 0, iqr: 0 };
  }
  
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Calculate quartile positions
  const q1Pos = Math.floor(sortedValues.length * 0.25);
  const q3Pos = Math.floor(sortedValues.length * 0.75);
  
  // Get quartile values
  const q1 = sortedValues[q1Pos];
  const q3 = sortedValues[q3Pos];
  const iqr = q3 - q1;
  
  return { q1, q3, iqr };
}

/**
 * Implementation of error function (erf)
 * Used in Chauvenet's criterion calculation
 */
export function erf(x: number): number {
  // Constants for Abramowitz and Stegun approximation
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  // Save the sign
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  // A&S formula 7.1.26
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
}

/**
 * Detect outliers using Chauvenet's criterion
 * This method is useful for smaller datasets as it considers the sample size
 * 
 * @param values Array of numeric values
 * @returns Object containing outlier indices, non-outlier indices, and probabilities
 */
export function detectOutliersChauvenets(
  values: number[]
): {
  outlierIndices: number[];
  nonOutlierIndices: number[];
  probabilities: number[];
} {
  if (values.length < 4) {
    return { 
      outlierIndices: [], 
      nonOutlierIndices: values.map((_, i) => i),
      probabilities: values.map(() => 1)
    };
  }
  
  const n = values.length;
  const avg = mean(values);
  const std = standardDeviation(values, true);
  
  if (std === 0) {
    return { 
      outlierIndices: [], 
      nonOutlierIndices: values.map((_, i) => i),
      probabilities: values.map(() => 1)
    };
  }
  
  // Calculate probabilities using the complementary error function
  const probabilities = values.map(value => {
    const z = Math.abs(value - avg) / std;
    // Approximation of the complementary error function
    return 1 - erf(z / Math.sqrt(2));
  });
  
  // Chauvenet's criterion: reject if P < 1/(2n)
  const threshold = 1 / (2 * n);
  
  const outlierIndices = probabilities
    .map((prob, index) => prob < threshold ? index : -1)
    .filter(index => index !== -1);
  
  const nonOutlierIndices = values
    .map((_, index) => outlierIndices.includes(index) ? -1 : index)
    .filter(index => index !== -1);
  
  return {
    outlierIndices,
    nonOutlierIndices,
    probabilities
  };
}

/**
 * Calculate weighted average based on a specified weight property
 * 
 * @param items Array of items
 * @param valueProperty Property name to extract values
 * @param weightProperty Property name to extract weights
 * @returns Weighted average
 */
export function weightedAverage<T>(
  items: T[],
  valueProperty: keyof T,
  weightProperty: keyof T
): number {
  if (items.length === 0) return 0;
  
  const totalWeight = items.reduce(
    (sum, item) => sum + Number(item[weightProperty]), 
    0
  );
  
  if (totalWeight === 0) return 0;
  
  const weightedSum = items.reduce(
    (sum, item) => sum + Number(item[valueProperty]) * Number(item[weightProperty]), 
    0
  );
  
  return weightedSum / totalWeight;
}

/**
 * Calculate coefficient of variation (CV)
 * Measures relative variability as std / mean
 */
export function coefficientOfVariation(values: number[]): number {
  const avg = mean(values);
  if (avg === 0) return 0;
  
  const std = standardDeviation(values);
  return std / avg;
}

/**
 * Blend two values based on their confidence levels
 * 
 * @param value1 First value
 * @param confidence1 Confidence in first value (0-1)
 * @param value2 Second value
 * @param confidence2 Confidence in second value (0-1)
 * @returns Blended value
 */
export function confidenceBlend(
  value1: number,
  confidence1: number,
  value2: number,
  confidence2: number
): number {
  // If either confidence is zero, return the other value
  if (confidence1 === 0) return value2;
  if (confidence2 === 0) return value1;
  
  // Normalize confidences to sum to 1
  const totalConfidence = confidence1 + confidence2;
  const weight1 = confidence1 / totalConfidence;
  const weight2 = confidence2 / totalConfidence;
  
  // Return weighted average
  return (value1 * weight1) + (value2 * weight2);
}

/**
 * Blend confidence ranges based on their confidence levels
 * 
 * @param range1 First range {low, high, confidence}
 * @param range2 Second range {low, high, confidence}
 * @returns Blended range {low, high, confidence}
 */
export function confidenceRangeBlend(
  range1: { low: number; high: number; confidence: number },
  range2: { low: number; high: number; confidence: number }
): { low: number; high: number; confidence: number } {
  // If either confidence is zero, return the other range
  if (range1.confidence === 0) return range2;
  if (range2.confidence === 0) return range1;
  
  // For each end of the range, calculate weighted value
  const low = confidenceBlend(
    range1.low, 
    range1.confidence, 
    range2.low, 
    range2.confidence
  );
  
  const high = confidenceBlend(
    range1.high, 
    range1.confidence, 
    range2.high, 
    range2.confidence
  );
  
  // Combined confidence is higher than either individual confidence
  // but still capped at 1.0
  const confidence = Math.min(
    1.0,
    range1.confidence + range2.confidence * (1 - range1.confidence)
  );
  
  return { low, high, confidence };
} 