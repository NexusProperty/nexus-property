import { toast } from "@/components/ui/use-toast";

// Types for REINZ API responses
export interface MarketStatistics {
  region: string;
  suburb: string;
  period: string;
  medianPrice: number;
  medianPriceChange: number;
  medianPriceChangePercentage: number;
  salesVolume: number;
  salesVolumeChange: number;
  salesVolumeChangePercentage: number;
  daysToSell: number;
  daysToSellChange: number;
  daysToSellChangePercentage: number;
  auctionClearanceRate: number;
  auctionClearanceRateChange: number;
  auctionClearanceRateChangePercentage: number;
  activeListings: number;
  activeListingsChange: number;
  activeListingsChangePercentage: number;
}

export interface ComparableProperty {
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
}

export interface ComparablePropertiesResponse {
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
  comparables: ComparableProperty[];
}

// Mock API key and base URL (in a real implementation, these would be stored securely)
const MOCK_API_KEY = "mock-reinz-api-key";
const MOCK_BASE_URL = "https://api.reinz.co.nz/v1";

/**
 * Simulates an API call to REINZ with a delay to mimic network latency
 */
async function mockApiCall<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Log the simulated API call
  console.log(`Mock REINZ API call to ${endpoint} with params:`, params);
  
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
  const suburb = params.suburb || "Example Suburb";
  const region = params.region || "Auckland";
  const address = params.address || "123 Example Street";
  
  if (endpoint.includes("/market-statistics")) {
    return getMockMarketStatistics(suburb, region) as unknown as T;
  } else if (endpoint.includes("/comparable-properties")) {
    return getMockComparableProperties(address) as unknown as T;
  }
  
  throw new Error(`Unknown endpoint: ${endpoint}`);
}

/**
 * Generates mock market statistics data
 */
function getMockMarketStatistics(suburb: string, region: string): MarketStatistics {
  const hash = suburb.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const medianPrice = 800000 + (hash % 1000000);
  const priceChange = (hash % 20) - 5; // -5% to +15%
  const priceChangePercentage = priceChange;
  
  const salesVolume = 50 + (hash % 100);
  const salesVolumeChange = (hash % 30) - 10; // -10% to +20%
  const salesVolumeChangePercentage = salesVolumeChange;
  
  const daysToSell = 20 + (hash % 30);
  const daysToSellChange = (hash % 20) - 10; // -10 to +10
  const daysToSellChangePercentage = Math.floor((daysToSellChange / daysToSell) * 100);
  
  const auctionClearanceRate = 50 + (hash % 30); // 50% to 80%
  const auctionClearanceRateChange = (hash % 10) - 5; // -5% to +5%
  const auctionClearanceRateChangePercentage = auctionClearanceRateChange;
  
  const activeListings = 20 + (hash % 50);
  const activeListingsChange = (hash % 20) - 10; // -10 to +10
  const activeListingsChangePercentage = Math.floor((activeListingsChange / activeListings) * 100);
  
  return {
    region,
    suburb,
    period: "Last 12 months",
    medianPrice,
    medianPriceChange: priceChange,
    medianPriceChangePercentage: priceChangePercentage,
    salesVolume,
    salesVolumeChange,
    salesVolumeChangePercentage,
    daysToSell,
    daysToSellChange,
    daysToSellChangePercentage,
    auctionClearanceRate,
    auctionClearanceRateChange,
    auctionClearanceRateChangePercentage,
    activeListings,
    activeListingsChange,
    activeListingsChangePercentage
  };
}

/**
 * Generates mock comparable properties data
 */
function getMockComparableProperties(address: string): ComparablePropertiesResponse {
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const parts = address.split(" ");
  const streetNumber = parseInt(parts[0]) || 123;
  const streetName = parts.slice(1).join(" ");
  
  // Generate subject property data
  const subjectProperty = {
    address,
    suburb: "Example Suburb",
    city: "Auckland",
    postcode: "1010",
    propertyType: "Residential",
    bedrooms: (hash % 5) + 1,
    bathrooms: (hash % 3) + 1,
    landArea: 300 + (hash % 500),
    floorArea: 100 + (hash % 300)
  };
  
  // Generate comparable properties
  const comparables: ComparableProperty[] = [];
  const comparableCount = (hash % 5) + 3; // 3-7 comparables
  
  for (let i = 0; i < comparableCount; i++) {
    const comparableAddress = `${(hash * (i + 1) % 100) + 1} ${streetName}`;
    const saleDate = new Date(Date.now() - (hash * (i + 1) % 10000000000)).toISOString().split('T')[0];
    const salePrice = 500000 + (hash * (i + 1) % 1000000);
    const distance = (hash * (i + 1) % 5) + 1; // 1-5 km
    const similarityScore = 70 + (hash * (i + 1) % 30); // 70-100%
    
    comparables.push({
      address: comparableAddress,
      suburb: "Example Suburb",
      city: "Auckland",
      postcode: "1010",
      propertyType: "Residential",
      bedrooms: ((hash * (i + 1)) % 5) + 1,
      bathrooms: ((hash * (i + 1)) % 3) + 1,
      landArea: 300 + ((hash * (i + 1)) % 500),
      floorArea: 100 + ((hash * (i + 1)) % 300),
      salePrice,
      saleDate,
      saleType: ((hash * (i + 1)) % 2) === 0 ? "Auction" : "Private Treaty",
      distance,
      similarityScore,
      features: [
        "Garage",
        "Deck",
        "Garden",
        "Modern Kitchen",
        "Ensuite"
      ].filter((_, index) => ((hash * (i + 1)) % 5) !== index) // Deterministic feature selection
    });
  }
  
  // Sort by similarity score (highest first)
  comparables.sort((a, b) => b.similarityScore - a.similarityScore);
  
  return {
    subjectProperty,
    comparables
  };
}

/**
 * Fetches market statistics from REINZ API
 */
export async function fetchMarketStatistics(suburb: string, region: string): Promise<MarketStatistics> {
  try {
    return await mockApiCall<MarketStatistics>("/market-statistics", { suburb, region });
  } catch (error) {
    console.error("Error fetching market statistics:", error);
    toast({
      title: "Error fetching market statistics",
      description: "An error occurred while fetching market statistics from REINZ.",
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Fetches comparable properties from REINZ API
 */
export async function fetchComparableProperties(address: string): Promise<ComparablePropertiesResponse> {
  try {
    return await mockApiCall<ComparablePropertiesResponse>("/comparable-properties", { address });
  } catch (error) {
    console.error("Error fetching comparable properties:", error);
    toast({
      title: "Error fetching comparable properties",
      description: "An error occurred while fetching comparable properties from REINZ.",
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Fetches all market data from REINZ API
 */
export async function fetchAllMarketData(address: string, suburb: string, region: string): Promise<{
  marketStatistics: MarketStatistics;
  comparableProperties: ComparablePropertiesResponse;
}> {
  try {
    // Fetch all data in parallel
    const [marketStatistics, comparableProperties] = await Promise.all([
      fetchMarketStatistics(suburb, region),
      fetchComparableProperties(address)
    ]);
    
    return {
      marketStatistics,
      comparableProperties
    };
  } catch (error) {
    console.error("Error fetching all market data:", error);
    toast({
      title: "Error fetching market data",
      description: "An error occurred while fetching market data from REINZ.",
      variant: "destructive"
    });
    throw error;
  }
} 