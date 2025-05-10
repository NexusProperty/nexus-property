import { toast } from "@/components/ui/use-toast";
import { 
  fetchAllPropertyData, 
  PropertyAttributes, 
  SalesHistory, 
  AVMData, 
  LocalMarketData 
} from "./corelogicService";
import { 
  fetchAllMarketData, 
  MarketStatistics, 
  ComparablePropertiesResponse 
} from "./reinzService";

// Standardized data structure for the appraisal process
export interface StandardizedPropertyData {
  // Property details
  property: {
    address: string;
    suburb: string;
    city: string;
    postcode: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    landArea: number;
    floorArea: number;
    yearBuilt: number;
    title: string;
    legalDescription: string;
    zoning: string;
    council: string;
    lastSaleDate?: string;
    lastSalePrice?: number;
  };
  
  // Sales history
  salesHistory: {
    sales: {
      date: string;
      price: number;
      type: string;
      source: string;
    }[];
  };
  
  // Valuation data
  valuation: {
    estimatedValue: number;
    confidenceScore: number;
    valueRange: {
      min: number;
      max: number;
    };
    lastUpdated: string;
    methodology: string;
  };
  
  // Market data
  marketData: {
    suburbMedianPrice: number;
    suburbMedianPriceChange: number;
    suburbMedianPriceChangePeriod: string;
    suburbSalesVolume: number;
    suburbSalesVolumeChange: number;
    suburbDaysOnMarket: number;
    suburbDaysOnMarketChange: number;
    suburbActiveListings: number;
    suburbActiveListingsChange: number;
    suburbAuctionClearanceRate: number;
    suburbAuctionClearanceRateChange: number;
  };
  
  // Comparable properties
  comparables: {
    subjectProperty: {
      address: string;
      suburb: string;
      city: string;
      postcode: string;
      propertyType: string;
      bedrooms: number;
      bathrooms: number;
      landArea: number;
      floorArea: number;
    };
    comparables: {
      address: string;
      suburb: string;
      city: string;
      postcode: string;
      propertyType: string;
      bedrooms: number;
      bathrooms: number;
      landArea: number;
      floorArea: number;
      salePrice: number;
      saleDate: string;
      saleType: string;
      distance: number;
      similarityScore: number;
      features: string[];
    }[];
  };
}

/**
 * Standardizes property data from CoreLogic and REINZ
 */
function standardizePropertyData(
  corelogicData: {
    propertyAttributes: PropertyAttributes;
    salesHistory: SalesHistory;
    avmData: AVMData;
    localMarketData: LocalMarketData;
  },
  reinzData: {
    marketStatistics: MarketStatistics;
    comparableProperties: ComparablePropertiesResponse;
  }
): StandardizedPropertyData {
  return {
    property: {
      address: corelogicData.propertyAttributes.address,
      suburb: corelogicData.propertyAttributes.suburb,
      city: corelogicData.propertyAttributes.city,
      postcode: corelogicData.propertyAttributes.postcode,
      propertyType: corelogicData.propertyAttributes.propertyType,
      bedrooms: corelogicData.propertyAttributes.bedrooms,
      bathrooms: corelogicData.propertyAttributes.bathrooms,
      landArea: corelogicData.propertyAttributes.landArea,
      floorArea: corelogicData.propertyAttributes.floorArea,
      yearBuilt: corelogicData.propertyAttributes.yearBuilt,
      title: corelogicData.propertyAttributes.title,
      legalDescription: corelogicData.propertyAttributes.legalDescription,
      zoning: corelogicData.propertyAttributes.zoning,
      council: corelogicData.propertyAttributes.council,
      lastSaleDate: corelogicData.propertyAttributes.lastSaleDate,
      lastSalePrice: corelogicData.propertyAttributes.lastSalePrice
    },
    salesHistory: {
      sales: corelogicData.salesHistory.sales
    },
    valuation: {
      estimatedValue: corelogicData.avmData.estimatedValue,
      confidenceScore: corelogicData.avmData.confidenceScore,
      valueRange: {
        min: corelogicData.avmData.valueRange.min,
        max: corelogicData.avmData.valueRange.max
      },
      lastUpdated: corelogicData.avmData.lastUpdated,
      methodology: corelogicData.avmData.methodology
    },
    marketData: {
      suburbMedianPrice: corelogicData.localMarketData.suburbMedianPrice,
      suburbMedianPriceChange: corelogicData.localMarketData.suburbMedianPriceChange,
      suburbMedianPriceChangePeriod: corelogicData.localMarketData.suburbMedianPriceChangePeriod,
      suburbSalesVolume: corelogicData.localMarketData.suburbSalesVolume,
      suburbSalesVolumeChange: corelogicData.localMarketData.suburbSalesVolumeChange,
      suburbDaysOnMarket: corelogicData.localMarketData.suburbDaysOnMarket,
      suburbDaysOnMarketChange: corelogicData.localMarketData.suburbDaysOnMarketChange,
      suburbActiveListings: corelogicData.localMarketData.suburbActiveListings,
      suburbActiveListingsChange: corelogicData.localMarketData.suburbActiveListingsChange,
      suburbAuctionClearanceRate: corelogicData.localMarketData.suburbAuctionClearanceRate,
      suburbAuctionClearanceRateChange: corelogicData.localMarketData.suburbAuctionClearanceRateChange
    },
    comparables: {
      subjectProperty: {
        address: reinzData.comparableProperties.subjectProperty.address,
        suburb: reinzData.comparableProperties.subjectProperty.suburb,
        city: reinzData.comparableProperties.subjectProperty.city,
        postcode: reinzData.comparableProperties.subjectProperty.postcode,
        propertyType: reinzData.comparableProperties.subjectProperty.propertyType,
        bedrooms: reinzData.comparableProperties.subjectProperty.bedrooms,
        bathrooms: reinzData.comparableProperties.subjectProperty.bathrooms,
        landArea: reinzData.comparableProperties.subjectProperty.landArea,
        floorArea: reinzData.comparableProperties.subjectProperty.floorArea
      },
      comparables: reinzData.comparableProperties.comparables
    }
  };
}

/**
 * Fetches and standardizes property data from CoreLogic and REINZ
 */
export async function fetchAndStandardizePropertyData(
  address: string,
  suburb: string,
  region: string
): Promise<StandardizedPropertyData> {
  try {
    // Fetch data from both APIs in parallel
    const [corelogicData, reinzData] = await Promise.all([
      fetchAllPropertyData(address),
      fetchAllMarketData(address, suburb, region)
    ]);
    
    // Standardize the data
    const standardizedData = standardizePropertyData(corelogicData, reinzData);
    
    return standardizedData;
  } catch (error) {
    console.error("Error fetching and standardizing property data:", error);
    toast({
      title: "Error fetching property data",
      description: "An error occurred while fetching and standardizing property data.",
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Validates the standardized property data
 */
export function validatePropertyData(data: StandardizedPropertyData): boolean {
  // Check if required fields are present
  if (!data.property.address || !data.property.suburb || !data.property.city) {
    return false;
  }
  
  // Check if property details are valid
  if (data.property.bedrooms < 0 || data.property.bathrooms < 0 || data.property.landArea < 0 || data.property.floorArea < 0) {
    return false;
  }
  
  // Check if valuation data is valid
  if (data.valuation.estimatedValue <= 0 || data.valuation.confidenceScore < 0 || data.valuation.confidenceScore > 100) {
    return false;
  }
  
  // Check if value range is valid
  if (data.valuation.valueRange.min <= 0 || data.valuation.valueRange.max <= 0 || data.valuation.valueRange.min > data.valuation.valueRange.max) {
    return false;
  }
  
  // Check if market data is valid
  if (data.marketData.suburbMedianPrice <= 0) {
    return false;
  }
  
  // Check if comparables are valid
  if (!data.comparables.comparables || data.comparables.comparables.length === 0) {
    return false;
  }
  
  return true;
}

/**
 * Cleans and standardizes property data
 */
export function cleanPropertyData(data: StandardizedPropertyData): StandardizedPropertyData {
  // Create a deep copy of the data
  const cleanedData = JSON.parse(JSON.stringify(data)) as StandardizedPropertyData;
  
  // Clean property details
  cleanedData.property.address = cleanedData.property.address.trim();
  cleanedData.property.suburb = cleanedData.property.suburb.trim();
  cleanedData.property.city = cleanedData.property.city.trim();
  cleanedData.property.postcode = cleanedData.property.postcode.trim();
  
  // Ensure numeric values are positive
  cleanedData.property.bedrooms = Math.max(0, cleanedData.property.bedrooms);
  cleanedData.property.bathrooms = Math.max(0, cleanedData.property.bathrooms);
  cleanedData.property.landArea = Math.max(0, cleanedData.property.landArea);
  cleanedData.property.floorArea = Math.max(0, cleanedData.property.floorArea);
  
  // Ensure year built is reasonable
  const currentYear = new Date().getFullYear();
  if (cleanedData.property.yearBuilt < 1800 || cleanedData.property.yearBuilt > currentYear) {
    cleanedData.property.yearBuilt = 0; // Unknown
  }
  
  // Clean valuation data
  cleanedData.valuation.estimatedValue = Math.max(0, cleanedData.valuation.estimatedValue);
  cleanedData.valuation.confidenceScore = Math.max(0, Math.min(100, cleanedData.valuation.confidenceScore));
  cleanedData.valuation.valueRange.min = Math.max(0, cleanedData.valuation.valueRange.min);
  cleanedData.valuation.valueRange.max = Math.max(cleanedData.valuation.valueRange.min, cleanedData.valuation.valueRange.max);
  
  // Clean market data
  cleanedData.marketData.suburbMedianPrice = Math.max(0, cleanedData.marketData.suburbMedianPrice);
  
  // Clean comparables
  cleanedData.comparables.comparables = cleanedData.comparables.comparables.filter(comp => {
    return comp.address && comp.salePrice > 0 && comp.similarityScore > 0;
  });
  
  return cleanedData;
} 