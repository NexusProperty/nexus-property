import { toast } from "@/components/ui/use-toast";

// Types for CoreLogic API responses
export interface PropertyAttributes {
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
}

export interface SalesHistory {
  sales: {
    date: string;
    price: number;
    type: string;
    source: string;
  }[];
}

export interface AVMData {
  estimatedValue: number;
  confidenceScore: number;
  valueRange: {
    min: number;
    max: number;
  };
  lastUpdated: string;
  methodology: string;
}

export interface LocalMarketData {
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
}

// Mock API key and base URL (in a real implementation, these would be stored securely)
const MOCK_API_KEY = "mock-corelogic-api-key";
const MOCK_BASE_URL = "https://api.corelogic.co.nz/v1";

/**
 * Simulates an API call to CoreLogic with a delay to mimic network latency
 */
async function mockApiCall<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Log the simulated API call
  console.log(`Mock CoreLogic API call to ${endpoint} with params:`, params);
  
  // In a real implementation, this would be an actual API call
  // return fetch(`${MOCK_BASE_URL}${endpoint}?${new URLSearchParams(params)}`, {
  //   headers: {
  //     'Authorization': `Bearer ${MOCK_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   }
  // }).then(res => res.json());
  
  // For now, return mock data based on the endpoint
  return getMockDataForEndpoint<T>(endpoint, params);
}

/**
 * Returns mock data based on the endpoint and parameters
 */
function getMockDataForEndpoint<T>(endpoint: string, params: Record<string, string>): T {
  const address = params.address || "123 Example Street";
  
  if (endpoint.includes("/property")) {
    return getMockPropertyAttributes(address) as unknown as T;
  } else if (endpoint.includes("/sales-history")) {
    return getMockSalesHistory(address) as unknown as T;
  } else if (endpoint.includes("/avm")) {
    return getMockAVMData(address) as unknown as T;
  } else if (endpoint.includes("/market-data")) {
    return getMockLocalMarketData(params.suburb || "Example Suburb") as unknown as T;
  }
  
  throw new Error(`Unknown endpoint: ${endpoint}`);
}

/**
 * Generates mock property attributes data
 */
function getMockPropertyAttributes(address: string): PropertyAttributes {
  const parts = address.split(" ");
  const streetNumber = parseInt(parts[0]) || 123;
  const streetName = parts.slice(1).join(" ");
  
  // Use deterministic values based on the address
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return {
    address,
    suburb: "Example Suburb",
    city: "Auckland",
    postcode: "1010",
    propertyType: "Residential",
    bedrooms: (hash % 5) + 1,
    bathrooms: (hash % 3) + 1,
    landArea: 300 + (hash % 500),
    floorArea: 100 + (hash % 300),
    yearBuilt: 1970 + (hash % 50),
    title: "Freehold",
    legalDescription: `Lot ${(hash % 100) + 1} DP ${(hash % 10000) + 1000}`,
    zoning: "Residential",
    council: "Auckland Council",
    lastSaleDate: new Date(Date.now() - (hash % 10000000000)).toISOString().split('T')[0],
    lastSalePrice: 500000 + (hash % 1000000)
  };
}

/**
 * Generates mock sales history data
 */
function getMockSalesHistory(address: string): SalesHistory {
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const salesCount = (hash % 3) + 1;
  const sales = [];
  
  for (let i = 0; i < salesCount; i++) {
    const date = new Date(Date.now() - (hash * (i + 1) % 10000000000));
    sales.push({
      date: date.toISOString().split('T')[0],
      price: 500000 + (hash * (i + 1) % 1000000),
      type: (hash * (i + 1) % 2) === 0 ? "Auction" : "Private Treaty",
      source: "CoreLogic"
    });
  }
  
  // Sort by date (newest first)
  sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return { sales };
}

/**
 * Generates mock AVM data
 */
function getMockAVMData(address: string): AVMData {
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseValue = 500000 + (hash % 1000000);
  const confidenceScore = 70 + (hash % 30); // 70-100%
  
  return {
    estimatedValue: baseValue,
    confidenceScore,
    valueRange: {
      min: Math.floor(baseValue * 0.9),
      max: Math.floor(baseValue * 1.1)
    },
    lastUpdated: new Date().toISOString().split('T')[0],
    methodology: "CoreLogic AVM Model"
  };
}

/**
 * Generates mock local market data
 */
function getMockLocalMarketData(suburb: string): LocalMarketData {
  const hash = suburb.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const medianPrice = 800000 + (hash % 1000000);
  const priceChange = (hash % 20) - 5; // -5% to +15%
  
  return {
    suburbMedianPrice: medianPrice,
    suburbMedianPriceChange: priceChange,
    suburbMedianPriceChangePeriod: "12 months",
    suburbSalesVolume: 50 + (hash % 100),
    suburbSalesVolumeChange: (hash % 30) - 10, // -10% to +20%
    suburbDaysOnMarket: 20 + (hash % 30),
    suburbDaysOnMarketChange: (hash % 20) - 10, // -10 to +10
    suburbActiveListings: 20 + (hash % 50),
    suburbActiveListingsChange: (hash % 20) - 10, // -10 to +10
    suburbAuctionClearanceRate: 50 + (hash % 30), // 50% to 80%
    suburbAuctionClearanceRateChange: (hash % 10) - 5 // -5% to +5%
  };
}

/**
 * Fetches property attributes from CoreLogic API
 */
export async function fetchPropertyAttributes(address: string): Promise<PropertyAttributes> {
  try {
    return await mockApiCall<PropertyAttributes>("/property", { address });
  } catch (error) {
    console.error("Error fetching property attributes:", error);
    toast({
      title: "Error fetching property data",
      description: "An error occurred while fetching property attributes from CoreLogic.",
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Fetches sales history from CoreLogic API
 */
export async function fetchSalesHistory(address: string): Promise<SalesHistory> {
  try {
    return await mockApiCall<SalesHistory>("/sales-history", { address });
  } catch (error) {
    console.error("Error fetching sales history:", error);
    toast({
      title: "Error fetching sales history",
      description: "An error occurred while fetching sales history from CoreLogic.",
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Fetches AVM data from CoreLogic API
 */
export async function fetchAVMData(address: string): Promise<AVMData> {
  try {
    return await mockApiCall<AVMData>("/avm", { address });
  } catch (error) {
    console.error("Error fetching AVM data:", error);
    toast({
      title: "Error fetching AVM data",
      description: "An error occurred while fetching AVM data from CoreLogic.",
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Fetches local market data from CoreLogic API
 */
export async function fetchLocalMarketData(suburb: string): Promise<LocalMarketData> {
  try {
    return await mockApiCall<LocalMarketData>("/market-data", { suburb });
  } catch (error) {
    console.error("Error fetching local market data:", error);
    toast({
      title: "Error fetching market data",
      description: "An error occurred while fetching local market data from CoreLogic.",
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Fetches all property data from CoreLogic API
 */
export async function fetchAllPropertyData(address: string): Promise<{
  propertyAttributes: PropertyAttributes;
  salesHistory: SalesHistory;
  avmData: AVMData;
  localMarketData: LocalMarketData;
}> {
  try {
    // Extract suburb from address (in a real implementation, this would be more sophisticated)
    const suburb = address.split(",")[1]?.trim() || "Example Suburb";
    
    // Fetch all data in parallel
    const [propertyAttributes, salesHistory, avmData, localMarketData] = await Promise.all([
      fetchPropertyAttributes(address),
      fetchSalesHistory(address),
      fetchAVMData(address),
      fetchLocalMarketData(suburb)
    ]);
    
    return {
      propertyAttributes,
      salesHistory,
      avmData,
      localMarketData
    };
  } catch (error) {
    console.error("Error fetching all property data:", error);
    toast({
      title: "Error fetching property data",
      description: "An error occurred while fetching property data from CoreLogic.",
      variant: "destructive"
    });
    throw error;
  }
} 