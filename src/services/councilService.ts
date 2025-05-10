import { toast } from "@/components/ui/use-toast";

// Types for Council API responses
export interface CouncilData {
  propertyId: string;
  councilName: string;
  rates: {
    annual: number;
    lastPaid: string;
    lastPaidAmount: number;
  };
  zoning: {
    primary: string;
    secondary?: string;
    description: string;
  };
  buildingConsents: {
    consentNumber: string;
    type: string;
    status: string;
    issueDate: string;
    completionDate?: string;
    description: string;
  }[];
  resourceConsents: {
    consentNumber: string;
    type: string;
    status: string;
    issueDate: string;
    expiryDate?: string;
    description: string;
  }[];
  floodHazard: {
    risk: "Low" | "Medium" | "High";
    description: string;
  };
  heritageStatus: {
    isHeritage: boolean;
    category?: string;
    description?: string;
  };
}

// Mock API key and base URL (in a real implementation, these would be stored securely)
const MOCK_API_KEY = "mock-council-api-key";
const MOCK_BASE_URL = "https://api.council.govt.nz/v1";

/**
 * Simulates an API call to Council API with a delay to mimic network latency
 */
async function mockApiCall<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Log the simulated API call
  console.log(`Mock Council API call to ${endpoint} with params:`, params);
  
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
  const council = params.council || "Auckland Council";
  
  if (endpoint.includes("/property-data")) {
    return getMockCouncilData(address, council) as unknown as T;
  }
  
  throw new Error(`Unknown endpoint: ${endpoint}`);
}

/**
 * Generates mock council data
 */
function getMockCouncilData(address: string, council: string): CouncilData {
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate building consents
  const buildingConsents = [];
  const buildingConsentCount = (hash % 3) + 1;
  
  for (let i = 0; i < buildingConsentCount; i++) {
    const issueDate = new Date(Date.now() - (hash * (i + 1) % 10000000000));
    const completionDate = new Date(issueDate.getTime() + (hash * (i + 1) % 1000000000));
    
    buildingConsents.push({
      consentNumber: `BC${(hash * (i + 1) % 10000)}`,
      type: (hash * (i + 1) % 2) === 0 ? "New Building" : "Alteration",
      status: "Completed",
      issueDate: issueDate.toISOString().split('T')[0],
      completionDate: completionDate.toISOString().split('T')[0],
      description: "Residential dwelling construction"
    });
  }
  
  // Generate resource consents
  const resourceConsents = [];
  const resourceConsentCount = (hash % 2) + 1;
  
  for (let i = 0; i < resourceConsentCount; i++) {
    const issueDate = new Date(Date.now() - (hash * (i + 1) % 10000000000));
    const expiryDate = new Date(issueDate.getTime() + (hash * (i + 1) % 10000000000));
    
    resourceConsents.push({
      consentNumber: `RC${(hash * (i + 1) % 10000)}`,
      type: (hash * (i + 1) % 2) === 0 ? "Subdivision" : "Land Use",
      status: "Active",
      issueDate: issueDate.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      description: "Residential subdivision"
    });
  }
  
  // Determine flood hazard risk
  const floodRiskValues = ["Low", "Medium", "High"];
  const floodRisk = floodRiskValues[hash % 3] as "Low" | "Medium" | "High";
  
  // Determine heritage status
  const isHeritage = (hash % 10) === 0; // 10% chance of being heritage
  const heritageCategories = ["Category 1", "Category 2", "Local Heritage"];
  const heritageCategory = isHeritage ? heritageCategories[hash % 3] : undefined;
  
  return {
    propertyId: `PID${hash % 10000}`,
    councilName: council,
    rates: {
      annual: 2000 + (hash % 3000),
      lastPaid: new Date(Date.now() - (hash % 10000000000)).toISOString().split('T')[0],
      lastPaidAmount: 2000 + (hash % 3000)
    },
    zoning: {
      primary: "Residential",
      secondary: (hash % 2) === 0 ? "Mixed Use" : undefined,
      description: "Residential zone with medium density housing"
    },
    buildingConsents,
    resourceConsents,
    floodHazard: {
      risk: floodRisk,
      description: floodRisk === "Low" 
        ? "Property is not in a flood hazard area" 
        : floodRisk === "Medium" 
          ? "Property is in a moderate flood hazard area" 
          : "Property is in a high flood hazard area"
    },
    heritageStatus: {
      isHeritage,
      category: heritageCategory,
      description: isHeritage 
        ? `Property is listed as ${heritageCategory} heritage` 
        : "Property is not listed as heritage"
    }
  };
}

/**
 * Fetches council data for a property
 */
export async function fetchCouncilData(address: string, council: string): Promise<CouncilData> {
  try {
    return await mockApiCall<CouncilData>("/property-data", { address, council });
  } catch (error) {
    console.error("Error fetching council data:", error);
    toast({
      title: "Error fetching council data",
      description: "An error occurred while fetching council data.",
      variant: "destructive"
    });
    throw error;
  }
} 