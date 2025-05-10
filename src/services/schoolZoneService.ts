import { toast } from "@/components/ui/use-toast";

// Types for School Zone API responses
export interface SchoolZoneData {
  address: string;
  schools: {
    name: string;
    type: "Primary" | "Intermediate" | "Secondary" | "Composite";
    decile: number;
    distance: number; // in meters
    isInZone: boolean;
    enrollment: number;
    address: string;
    website?: string;
    phone?: string;
    email?: string;
    performance?: {
      nceaPassRate?: number;
      attendanceRate?: number;
    };
  }[];
  earlyChildhood: {
    name: string;
    type: string;
    distance: number; // in meters
    address: string;
    phone?: string;
    email?: string;
    capacity?: number;
    currentEnrollment?: number;
  }[];
  tertiary: {
    name: string;
    type: string;
    distance: number; // in meters
    address: string;
    website?: string;
    phone?: string;
    email?: string;
  }[];
}

// Mock API key and base URL (in a real implementation, these would be stored securely)
const MOCK_API_KEY = "mock-schoolzone-api-key";
const MOCK_BASE_URL = "https://api.schoolzone.govt.nz/v1";

/**
 * Simulates an API call to School Zone API with a delay to mimic network latency
 */
async function mockApiCall<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Log the simulated API call
  console.log(`Mock School Zone API call to ${endpoint} with params:`, params);
  
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
  
  if (endpoint.includes("/school-zones")) {
    return getMockSchoolZoneData(address) as unknown as T;
  }
  
  throw new Error(`Unknown endpoint: ${endpoint}`);
}

/**
 * Generates mock school zone data
 */
function getMockSchoolZoneData(address: string): SchoolZoneData {
  const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate schools
  const schools = [];
  const schoolCount = (hash % 3) + 2; // 2-4 schools
  
  const schoolTypes = ["Primary", "Intermediate", "Secondary", "Composite"];
  const schoolNames = [
    "Auckland Grammar School",
    "Epsom Girls Grammar",
    "Mount Albert Grammar School",
    "Auckland Normal Intermediate",
    "Remuera Primary School",
    "Epsom Primary School",
    "Mount Albert Primary School",
    "Royal Oak Primary School",
    "Onehunga High School",
    "Mount Roskill Grammar School"
  ];
  
  for (let i = 0; i < schoolCount; i++) {
    const schoolType = schoolTypes[(hash * (i + 1)) % schoolTypes.length] as "Primary" | "Intermediate" | "Secondary" | "Composite";
    const schoolName = schoolNames[(hash * (i + 1)) % schoolNames.length];
    const isInZone = (hash * (i + 1)) % 3 === 0; // 1/3 chance of being in zone
    
    schools.push({
      name: schoolName,
      type: schoolType,
      decile: (hash * (i + 1) % 10) + 1, // 1-10
      distance: (hash * (i + 1) % 2000) + 100, // 100-2100 meters
      isInZone,
      enrollment: 100 + (hash * (i + 1) % 900), // 100-1000 students
      address: `${(hash * (i + 1) % 100) + 1} School Road, Auckland`,
      website: `https://www.${schoolName.toLowerCase().replace(/\s+/g, '')}.school.nz`,
      phone: `09 ${(hash * (i + 1) % 1000000) + 1000000}`,
      email: `info@${schoolName.toLowerCase().replace(/\s+/g, '')}.school.nz`,
      performance: {
        nceaPassRate: 70 + (hash * (i + 1) % 30), // 70-100%
        attendanceRate: 80 + (hash * (i + 1) % 20) // 80-100%
      }
    });
  }
  
  // Generate early childhood centers
  const earlyChildhood = [];
  const earlyChildhoodCount = (hash % 3) + 1; // 1-3 centers
  
  const earlyChildhoodTypes = ["Kindergarten", "Playcentre", "Education and Care", "Home-based"];
  const earlyChildhoodNames = [
    "Auckland Kindergarten",
    "Epsom Playcentre",
    "Mount Albert Education and Care",
    "Royal Oak Kindergarten",
    "Onehunga Playcentre"
  ];
  
  for (let i = 0; i < earlyChildhoodCount; i++) {
    const type = earlyChildhoodTypes[(hash * (i + 1)) % earlyChildhoodTypes.length];
    const name = earlyChildhoodNames[(hash * (i + 1)) % earlyChildhoodNames.length];
    
    earlyChildhood.push({
      name,
      type,
      distance: (hash * (i + 1) % 1500) + 100, // 100-1600 meters
      address: `${(hash * (i + 1) % 100) + 1} Childcare Road, Auckland`,
      phone: `09 ${(hash * (i + 1) % 1000000) + 1000000}`,
      email: `info@${name.toLowerCase().replace(/\s+/g, '')}.org.nz`,
      capacity: 20 + (hash * (i + 1) % 30), // 20-50 children
      currentEnrollment: 10 + (hash * (i + 1) % 40) // 10-50 children
    });
  }
  
  // Generate tertiary institutions
  const tertiary = [];
  const tertiaryCount = (hash % 2) + 1; // 1-2 institutions
  
  const tertiaryTypes = ["University", "Polytechnic", "Private Training Establishment"];
  const tertiaryNames = [
    "University of Auckland",
    "Auckland University of Technology",
    "Unitec Institute of Technology",
    "Manukau Institute of Technology"
  ];
  
  for (let i = 0; i < tertiaryCount; i++) {
    const type = tertiaryTypes[(hash * (i + 1)) % tertiaryTypes.length];
    const name = tertiaryNames[(hash * (i + 1)) % tertiaryNames.length];
    
    tertiary.push({
      name,
      type,
      distance: (hash * (i + 1) % 5000) + 1000, // 1000-6000 meters
      address: `${(hash * (i + 1) % 100) + 1} University Road, Auckland`,
      website: `https://www.${name.toLowerCase().replace(/\s+/g, '')}.ac.nz`,
      phone: `09 ${(hash * (i + 1) % 1000000) + 1000000}`,
      email: `info@${name.toLowerCase().replace(/\s+/g, '')}.ac.nz`
    });
  }
  
  return {
    address,
    schools,
    earlyChildhood,
    tertiary
  };
}

/**
 * Fetches school zone data for a property
 */
export async function fetchSchoolZoneData(address: string): Promise<SchoolZoneData> {
  try {
    return await mockApiCall<SchoolZoneData>("/school-zones", { address });
  } catch (error) {
    console.error("Error fetching school zone data:", error);
    toast({
      title: "Error fetching school zone data",
      description: "An error occurred while fetching school zone data.",
      variant: "destructive"
    });
    throw error;
  }
} 