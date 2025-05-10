import { toast } from "@/components/ui/use-toast";

// Types for Mapping API responses
export interface MapData {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  boundaries: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  aerialImage: {
    url: string;
    year: number;
    resolution: string;
  };
  streetView: {
    url: string;
    year: number;
    direction: string;
  };
  topography: {
    elevation: number;
    slope: number;
    aspect: string;
  };
  nearbyAmenities: {
    type: string;
    name: string;
    distance: number; // in meters
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }[];
  transport: {
    busStops: {
      name: string;
      distance: number; // in meters
      routes: string[];
    }[];
    trainStations: {
      name: string;
      distance: number; // in meters
      lines: string[];
    }[];
    ferryTerminals: {
      name: string;
      distance: number; // in meters
      routes: string[];
    }[];
  };
  floodZones: {
    type: string;
    risk: "Low" | "Medium" | "High";
    description: string;
  }[];
  landCover: {
    type: string;
    percentage: number;
  }[];
}

// Mock API key and base URL (in a real implementation, these would be stored securely)
const MOCK_API_KEY = "mock-mapping-api-key";
const MOCK_BASE_URL = "https://api.mapping.govt.nz/v1";

/**
 * Simulates an API call to Mapping API with a delay to mimic network latency
 */
async function mockApiCall<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Log the simulated API call
  console.log(`Mock Mapping API call to ${endpoint} with params:`, params);
  
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
  
  if (endpoint.includes("/map-data")) {
    return getMockMapData(address) as unknown as T;
  }
  
  throw new Error(`Unknown endpoint: ${endpoint}`);
}

/**
 * Generates mock map data
 */
function getMockMapData(address: string): MapData {
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate coordinates (Auckland area)
  const latitude = -36.8509 + (hash % 100) / 1000;
  const longitude = 174.7645 + (hash % 100) / 1000;
  
  // Generate boundaries (roughly 100m x 100m)
  const boundaries = {
    north: latitude + 0.0005,
    south: latitude - 0.0005,
    east: longitude + 0.0005,
    west: longitude - 0.0005
  };
  
  // Generate nearby amenities
  const nearbyAmenities = [];
  const amenityCount = (hash % 5) + 5; // 5-9 amenities
  
  const amenityTypes = ["Park", "Shopping Center", "Restaurant", "Cafe", "Gym", "Library", "Hospital", "Beach", "Golf Course"];
  const amenityNames = [
    "Central Park",
    "Auckland Shopping Center",
    "The Local Cafe",
    "Fitness First",
    "Auckland Library",
    "Auckland Hospital",
    "Mission Bay Beach",
    "Auckland Golf Club",
    "Eden Park",
    "Auckland Zoo"
  ];
  
  for (let i = 0; i < amenityCount; i++) {
    const type = amenityTypes[(hash * (i + 1)) % amenityTypes.length];
    const name = amenityNames[(hash * (i + 1)) % amenityNames.length];
    const distance = (hash * (i + 1) % 2000) + 100; // 100-2100 meters
    
    // Calculate coordinates based on distance and random angle
    const angle = (hash * (i + 1) % 360) * Math.PI / 180;
    const amenityLatitude = latitude + (distance / 111000) * Math.cos(angle);
    const amenityLongitude = longitude + (distance / (111000 * Math.cos(latitude * Math.PI / 180))) * Math.sin(angle);
    
    nearbyAmenities.push({
      type,
      name,
      distance,
      coordinates: {
        latitude: amenityLatitude,
        longitude: amenityLongitude
      }
    });
  }
  
  // Generate transport data
  const busStops = [];
  const busStopCount = (hash % 3) + 2; // 2-4 bus stops
  
  const busStopNames = [
    "Queen Street Bus Stop",
    "Karangahape Road Bus Stop",
    "Dominion Road Bus Stop",
    "Mount Eden Road Bus Stop",
    "New North Road Bus Stop"
  ];
  
  for (let i = 0; i < busStopCount; i++) {
    const name = busStopNames[(hash * (i + 1)) % busStopNames.length];
    const distance = (hash * (i + 1) % 500) + 50; // 50-550 meters
    
    busStops.push({
      name,
      distance,
      routes: [`${(hash * (i + 1) % 100) + 1}`, `${(hash * (i + 1) % 100) + 2}`, `${(hash * (i + 1) % 100) + 3}`]
    });
  }
  
  const trainStations = [];
  const trainStationCount = (hash % 2) + 1; // 1-2 train stations
  
  const trainStationNames = [
    "Britomart Station",
    "Newmarket Station",
    "Mount Eden Station",
    "Kingsland Station",
    "Morningside Station"
  ];
  
  for (let i = 0; i < trainStationCount; i++) {
    const name = trainStationNames[(hash * (i + 1)) % trainStationNames.length];
    const distance = (hash * (i + 1) % 1000) + 500; // 500-1500 meters
    
    trainStations.push({
      name,
      distance,
      lines: ["Western Line", "Eastern Line", "Southern Line"]
    });
  }
  
  const ferryTerminals = [];
  const ferryTerminalCount = (hash % 2); // 0-1 ferry terminals
  
  const ferryTerminalNames = [
    "Auckland Ferry Terminal",
    "Devonport Ferry Terminal",
    "Half Moon Bay Ferry Terminal"
  ];
  
  for (let i = 0; i < ferryTerminalCount; i++) {
    const name = ferryTerminalNames[(hash * (i + 1)) % ferryTerminalNames.length];
    const distance = (hash * (i + 1) % 2000) + 1000; // 1000-3000 meters
    
    ferryTerminals.push({
      name,
      distance,
      routes: ["Auckland-Devonport", "Auckland-Waiheke", "Auckland-Rangitoto"]
    });
  }
  
  // Generate flood zones
  const floodZones = [];
  const floodZoneCount = (hash % 2) + 1; // 1-2 flood zones
  
  const floodZoneTypes = ["River", "Coastal", "Stormwater"];
  const floodRiskValues = ["Low", "Medium", "High"];
  
  for (let i = 0; i < floodZoneCount; i++) {
    const type = floodZoneTypes[(hash * (i + 1)) % floodZoneTypes.length];
    const risk = floodRiskValues[(hash * (i + 1)) % floodRiskValues.length] as "Low" | "Medium" | "High";
    
    floodZones.push({
      type,
      risk,
      description: `${type} flood zone with ${risk.toLowerCase()} risk`
    });
  }
  
  // Generate land cover
  const landCover = [];
  const landCoverTypes = ["Residential", "Commercial", "Parkland", "Water", "Forest"];
  
  // Ensure percentages add up to 100%
  let remainingPercentage = 100;
  
  for (let i = 0; i < landCoverTypes.length; i++) {
    const type = landCoverTypes[i];
    let percentage;
    
    if (i === landCoverTypes.length - 1) {
      // Last type gets the remaining percentage
      percentage = remainingPercentage;
    } else {
      // Random percentage, but ensure we don't exceed remaining
      percentage = Math.min((hash * (i + 1) % 30) + 10, remainingPercentage);
      remainingPercentage -= percentage;
    }
    
    landCover.push({
      type,
      percentage
    });
  }
  
  return {
    address,
    coordinates: {
      latitude,
      longitude
    },
    boundaries,
    aerialImage: {
      url: `https://api.mapping.govt.nz/v1/aerial-images/${latitude}/${longitude}`,
      year: 2020 + (hash % 3),
      resolution: "10cm"
    },
    streetView: {
      url: `https://api.mapping.govt.nz/v1/street-view/${latitude}/${longitude}`,
      year: 2021 + (hash % 2),
      direction: "North"
    },
    topography: {
      elevation: 10 + (hash % 100),
      slope: (hash % 15),
      aspect: ["North", "South", "East", "West"][hash % 4]
    },
    nearbyAmenities,
    transport: {
      busStops,
      trainStations,
      ferryTerminals
    },
    floodZones,
    landCover
  };
}

/**
 * Fetches map data for a property
 */
export async function fetchMapData(address: string): Promise<MapData> {
  try {
    return await mockApiCall<MapData>("/map-data", { address });
  } catch (error) {
    console.error("Error fetching map data:", error);
    toast({
      title: "Error fetching map data",
      description: "An error occurred while fetching map data.",
      variant: "destructive"
    });
    throw error;
  }
} 