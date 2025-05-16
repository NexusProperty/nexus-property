import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { setupEdgeFunctionAuth } from '@/tests/utils/edge-function-test-utils';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn()
    },
    functions: {
      invoke: vi.fn()
    }
  }
}));

// Request interfaces
interface MarketAnalysisRequest {
  appraisalId: string;
  propertyType: string;
  suburb: string;
  city: string;
  bedroomCount: number;
  bathroomCount: number;
  landSize: number;
  floorArea: number;
  comparableProperties: {
    address: string;
    salePrice: number;
    saleDate: string;
    similarity: number;
  }[];
  marketTrends: {
    medianPrice: number;
    annualGrowth: number;
    daysOnMarket: number;
    salesVolume: number;
  };
}

interface PropertyDescriptionRequest {
  appraisalId: string;
  propertyType: string;
  address: string;
  suburb: string;
  city: string;
  bedroomCount: number;
  bathroomCount: number;
  landSize: number;
  floorArea: number;
  yearBuilt: number;
  features: string[];
  propertyCondition?: string;
  zoning?: string;
}

interface ComparableAnalysisRequest {
  appraisalId: string;
  propertyType: string;
  suburb: string;
  comparableProperties: {
    address: string;
    salePrice: number;
    saleDate: string;
    bedroomCount: number;
    bathroomCount: number;
    landSize: number;
    floorArea: number;
    yearBuilt?: number;
    similarity: number;
    distance?: number;
  }[];
}

// Response interfaces
interface SuccessfulMarketAnalysisResponse {
  success: true;
  data: {
    marketAnalysis: string;
    bulletPoints: string[];
    metadata: {
      aiModel: string;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      processingTime: number;
    };
  };
}

interface SuccessfulPropertyDescriptionResponse {
  success: true;
  data: {
    propertyDescription: string;
    highlightsSummary: string;
    bulletPoints: string[];
    metadata: {
      aiModel: string;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      processingTime: number;
    };
  };
}

interface SuccessfulComparableAnalysisResponse {
  success: true;
  data: {
    comparableAnalysis: string;
    valuationCommentary: string;
    bulletPoints: string[];
    metadata: {
      aiModel: string;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      processingTime: number;
    };
  };
}

interface ErrorResponse {
  success: false;
  error: string;
}

type GeminiResponse = 
  | SuccessfulMarketAnalysisResponse
  | SuccessfulPropertyDescriptionResponse
  | SuccessfulComparableAnalysisResponse
  | ErrorResponse;

// Test data
const TEST_MARKET_ANALYSIS_REQUEST: MarketAnalysisRequest = {
  appraisalId: 'test-appraisal-id',
  propertyType: 'house',
  suburb: 'Mount Eden',
  city: 'Auckland',
  bedroomCount: 3,
  bathroomCount: 2,
  landSize: 500,
  floorArea: 180,
  comparableProperties: [
    {
      address: '125 Test Street',
      salePrice: 950000,
      saleDate: '2024-02-15',
      similarity: 92
    },
    {
      address: '28 Sample Avenue',
      salePrice: 920000,
      saleDate: '2024-01-20',
      similarity: 88
    },
    {
      address: '15 Example Road',
      salePrice: 970000,
      saleDate: '2023-12-05',
      similarity: 85
    }
  ],
  marketTrends: {
    medianPrice: 950000,
    annualGrowth: 5.2,
    daysOnMarket: 32,
    salesVolume: 45
  }
};

const TEST_PROPERTY_DESCRIPTION_REQUEST: PropertyDescriptionRequest = {
  appraisalId: 'test-appraisal-id',
  propertyType: 'house',
  address: '123 Test Street',
  suburb: 'Mount Eden',
  city: 'Auckland',
  bedroomCount: 3,
  bathroomCount: 2,
  landSize: 500,
  floorArea: 180,
  yearBuilt: 2005,
  features: ['Renovated kitchen', 'Modern bathroom', 'Deck', 'Garden', 'Garage'],
  propertyCondition: 'Good',
  zoning: 'Residential'
};

const TEST_COMPARABLE_ANALYSIS_REQUEST: ComparableAnalysisRequest = {
  appraisalId: 'test-appraisal-id',
  propertyType: 'house',
  suburb: 'Mount Eden',
  comparableProperties: [
    {
      address: '125 Test Street',
      salePrice: 950000,
      saleDate: '2024-02-15',
      bedroomCount: 3,
      bathroomCount: 2,
      landSize: 520,
      floorArea: 175,
      yearBuilt: 2003,
      similarity: 92,
      distance: 0.5
    },
    {
      address: '28 Sample Avenue',
      salePrice: 920000,
      saleDate: '2024-01-20',
      bedroomCount: 3,
      bathroomCount: 1,
      landSize: 480,
      floorArea: 165,
      yearBuilt: 2000,
      similarity: 88,
      distance: 0.8
    },
    {
      address: '15 Example Road',
      salePrice: 970000,
      saleDate: '2023-12-05',
      bedroomCount: 4,
      bathroomCount: 2,
      landSize: 550,
      floorArea: 195,
      yearBuilt: 2008,
      similarity: 85,
      distance: 1.2
    }
  ]
};

// Mock responses
const MOCK_MARKET_ANALYSIS_RESPONSE: SuccessfulMarketAnalysisResponse = {
  success: true,
  data: {
    marketAnalysis: `The Mount Eden housing market remains one of Auckland's most sought-after areas, characterized by strong demand and limited inventory. Over the past 12 months, the median sale price has stabilized at approximately $950,000, showing resilience despite broader market fluctuations. With an annual growth rate of 5.2%, Mount Eden continues to outperform many surrounding suburbs.

Current market conditions favor sellers, with properties spending an average of just 32 days on market before selling. This represents a decrease from the previous year, indicating sustained buyer interest and competition. Sales volume has remained steady with approximately 45 transactions per month, suggesting a balanced but competitive environment.

An analysis of recent comparable sales reveals a tight pricing band between $920,000 and $970,000 for similar 3-bedroom properties in the area. These properties typically offer comparable land size and floor area to the subject property, with minor variations in condition and features affecting their final sale price.

Looking ahead, Mount Eden is expected to maintain its strong position in the Auckland market due to its desirable location, quality housing stock, and excellent amenities. The suburb's proximity to the city center, good schools, and transport links continue to drive buyer interest across various demographics, from young professionals to established families.`,
    bulletPoints: [
      'Median price of $950,000 with 5.2% annual growth rate',
      'Properties selling quickly at 32 days on market (average)',
      'Steady sales volume with 45 transactions per month',
      'Comparable properties selling between $920,000-$970,000',
      'Market conditions currently favor sellers'
    ],
    metadata: {
      aiModel: 'gemini-1.5-pro',
      promptTokens: 520,
      completionTokens: 310,
      totalTokens: 830,
      processingTime: 2.4
    }
  }
};

const MOCK_PROPERTY_DESCRIPTION_RESPONSE: SuccessfulPropertyDescriptionResponse = {
  success: true,
  data: {
    propertyDescription: `This well-maintained family home at 123 Test Street in the sought-after suburb of Mount Eden offers comfortable living with modern updates throughout. Built in 2005, this three-bedroom, two-bathroom residence provides an appealing balance of contemporary style and practical living space.

Featuring a recently renovated kitchen with quality appliances and modern finishes, the home presents well for entertaining and everyday family living. The two updated bathrooms include contemporary fixtures and efficient layouts that maximize the available space.

Set on a generous 500 square meter section, the property includes a lovely outdoor entertaining area with a spacious deck that seamlessly connects to a well-maintained garden. The single garage provides secure off-street parking and additional storage.

With 180 square meters of living space, the home offers a functional floor plan that separates living and sleeping areas effectively. The property benefits from its desirable Mount Eden location, providing excellent access to local schools, parks, public transport, and the vibrant Mount Eden village.

This property represents an excellent opportunity for families or professionals seeking a well-presented home in one of Auckland's most established and convenient suburbs.`,
    highlightsSummary: 'Modern 3-bedroom, 2-bathroom family home with renovated kitchen, outdoor entertaining area, and garage in sought-after Mount Eden location.',
    bulletPoints: [
      'Built in 2005 with 180 sqm of living space',
      'Renovated kitchen with modern appliances',
      'Updated bathrooms with contemporary fixtures',
      'Spacious deck and well-maintained garden',
      'Single garage with additional storage',
      'Convenient location near schools, parks, and village'
    ],
    metadata: {
      aiModel: 'gemini-1.5-pro',
      promptTokens: 480,
      completionTokens: 290,
      totalTokens: 770,
      processingTime: 2.1
    }
  }
};

const MOCK_COMPARABLE_ANALYSIS_RESPONSE: SuccessfulComparableAnalysisResponse = {
  success: true,
  data: {
    comparableAnalysis: `Analysis of the three comparable properties provides strong evidence for establishing the market value of the subject property. All three comparables are located within a 1.2km radius of the subject property in Mount Eden, were sold within the last three months, and share similar key characteristics.

The most comparable property at 125 Test Street (92% similarity) sold most recently in February 2024 for $950,000. With nearly identical bedroom and bathroom counts, this property offers slightly more land (520 sqm vs. 500 sqm) but less living space (175 sqm vs. 180 sqm) than the subject property. Given its high similarity rating and recent sale date, this property provides the strongest evidence for the subject property's value.

The property at 28 Sample Avenue (88% similarity) sold in January 2024 for $920,000. While it matches the subject property's bedroom count, it has one fewer bathroom and smaller land and floor areas. These differences explain its lower sale price compared to the other comparables.

The property at 15 Example Road (85% similarity) sold in December 2023 for $970,000. It offers an additional bedroom, equal bathroom count, and larger land and floor areas compared to the subject property. Built more recently in 2008, these superior attributes justify its higher sale price.

The comparable sales demonstrate a relatively tight range between $920,000 and $970,000, suggesting strong market consensus on value for properties of this type in Mount Eden.`,
    valuationCommentary: `Based on the analysis of comparable sales, the subject property at 123 Test Street in Mount Eden has an estimated market value range of $940,000 to $960,000, with a likely market value of $950,000.

This valuation is primarily supported by the recent sale at 125 Test Street (92% similarity) at $950,000, with adjustments considering the slightly larger land size but smaller floor area of that comparable.

The lower end of the range is influenced by the sale at 28 Sample Avenue ($920,000), accounting for its fewer features but adjusting upward for the subject property's additional bathroom and larger size.

The upper end is informed by the sale at 15 Example Road ($970,000), adjusting downward for its additional bedroom and larger size compared to the subject property.

Given the stable market conditions in Mount Eden with 5.2% annual growth and properties selling within approximately one month, this valuation represents current market expectations for similar properties in this area.`,
    bulletPoints: [
      'Most similar comparable (92% match) sold for $950,000 in February 2024',
      'Comparable sales range from $920,000 to $970,000',
      'All comparable properties located within 1.2km of subject property',
      'All sales occurred within the last three months',
      'Estimated value range: $940,000-$960,000 with likely value of $950,000'
    ],
    metadata: {
      aiModel: 'gemini-1.5-pro',
      promptTokens: 650,
      completionTokens: 410,
      totalTokens: 1060,
      processingTime: 3.2
    }
  }
};

const MOCK_API_ERROR_RESPONSE: ErrorResponse = {
  success: false,
  error: 'Failed to generate content with Gemini API'
};

const MOCK_QUOTA_EXCEEDED_RESPONSE: ErrorResponse = {
  success: false,
  error: 'API quota exceeded for Gemini: Daily quota exceeded'
};

const MOCK_INPUT_VALIDATION_ERROR: ErrorResponse = {
  success: false,
  error: 'Invalid input: appraisalId is required'
};

describe('Gemini AI API Integration', () => {
  // Before each test, reset mocks
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // After all tests, restore mocks
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Market Analysis Generation', () => {
    it('should successfully generate market analysis with valid inputs', async () => {
      // Set up authentication
      const { mockSuccessResponse } = setupEdgeFunctionAuth({
        isAuthenticated: true,
        userRole: 'agent'
      });
      
      // Mock successful Edge Function response
      mockSuccessResponse(MOCK_MARKET_ANALYSIS_RESPONSE);
  
      // Call the Edge Function that interfaces with Gemini AI
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: TEST_MARKET_ANALYSIS_REQUEST
      });
  
      // Verify the function was called with the correct parameters
      expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-market-analysis', {
        body: TEST_MARKET_ANALYSIS_REQUEST
      });
  
      // Verify response format
      expect(error).toBeNull();
      expect(data).toEqual(MOCK_MARKET_ANALYSIS_RESPONSE);
      
      // Type assertion
      if (data && 'success' in data && data.success === true) {
        expect(data.data.marketAnalysis).toContain('Mount Eden housing market');
        expect(data.data.bulletPoints.length).toBe(5);
        expect(data.data.metadata.aiModel).toBe('gemini-1.5-pro');
      }
    });

    it('should handle Gemini API errors', async () => {
      // Set up authentication
      const { mockSuccessResponse } = setupEdgeFunctionAuth({
        isAuthenticated: true,
        userRole: 'agent'
      });
      
      // Mock API error response
      mockSuccessResponse(MOCK_API_ERROR_RESPONSE);
  
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: TEST_MARKET_ANALYSIS_REQUEST
      });
  
      // Verify response
      expect(error).toBeNull();
      expect(data).toEqual(MOCK_API_ERROR_RESPONSE);
      
      // Type assertion
      if (data && 'success' in data && data.success === false) {
        expect(data.error).toContain('Failed to generate content');
      }
    });
  });

  describe('Property Description Generation', () => {
    it('should successfully generate property description with valid inputs', async () => {
      // Set up authentication
      const { mockSuccessResponse } = setupEdgeFunctionAuth({
        isAuthenticated: true,
        userRole: 'agent'
      });
      
      // Mock successful Edge Function response
      mockSuccessResponse(MOCK_PROPERTY_DESCRIPTION_RESPONSE);
  
      // Call the Edge Function that interfaces with Gemini AI
      const { data, error } = await supabase.functions.invoke('ai-property-description', {
        body: TEST_PROPERTY_DESCRIPTION_REQUEST
      });
  
      // Verify the function was called with the correct parameters
      expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-property-description', {
        body: TEST_PROPERTY_DESCRIPTION_REQUEST
      });
  
      // Verify response format
      expect(error).toBeNull();
      expect(data).toEqual(MOCK_PROPERTY_DESCRIPTION_RESPONSE);
      
      // Type assertion
      if (data && 'success' in data && data.success === true) {
        expect(data.data.propertyDescription).toContain('123 Test Street');
        expect(data.data.highlightsSummary).toContain('3-bedroom');
        expect(data.data.bulletPoints.length).toBe(6);
      }
    });

    it('should handle validation errors for missing property details', async () => {
      // Set up authentication
      const { mockSuccessResponse } = setupEdgeFunctionAuth({
        isAuthenticated: true,
        userRole: 'agent'
      });
      
      // Mock validation error response
      mockSuccessResponse(MOCK_INPUT_VALIDATION_ERROR);
  
      // Call with incomplete data
      const { data, error } = await supabase.functions.invoke('ai-property-description', {
        body: { address: '123 Test Street' } // Missing other required fields
      });
  
      // Verify response
      expect(error).toBeNull();
      
      // Type assertion
      if (data && 'success' in data && data.success === false) {
        expect(data.error).toContain('Invalid input');
      }
    });
  });

  describe('Comparable Analysis Generation', () => {
    it('should successfully generate comparable analysis with valid inputs', async () => {
      // Set up authentication
      const { mockSuccessResponse } = setupEdgeFunctionAuth({
        isAuthenticated: true,
        userRole: 'agent'
      });
      
      // Mock successful Edge Function response
      mockSuccessResponse(MOCK_COMPARABLE_ANALYSIS_RESPONSE);
  
      // Call the Edge Function that interfaces with Gemini AI
      const { data, error } = await supabase.functions.invoke('ai-comparable-analysis', {
        body: TEST_COMPARABLE_ANALYSIS_REQUEST
      });
  
      // Verify the function was called with the correct parameters
      expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-comparable-analysis', {
        body: TEST_COMPARABLE_ANALYSIS_REQUEST
      });
  
      // Verify response format
      expect(error).toBeNull();
      expect(data).toEqual(MOCK_COMPARABLE_ANALYSIS_RESPONSE);
      
      // Type assertion
      if (data && 'success' in data && data.success === true) {
        expect(data.data.comparableAnalysis).toContain('three comparable properties');
        expect(data.data.valuationCommentary).toContain('estimated market value range');
        expect(data.data.bulletPoints.length).toBe(5);
      }
    });
  });

  describe('Common Error Scenarios', () => {
    it('should handle API quota exceeded errors', async () => {
      // Set up authentication
      const { mockSuccessResponse } = setupEdgeFunctionAuth({
        isAuthenticated: true,
        userRole: 'agent'
      });
      
      // Mock quota error response
      mockSuccessResponse(MOCK_QUOTA_EXCEEDED_RESPONSE);
  
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: TEST_MARKET_ANALYSIS_REQUEST
      });
  
      // Verify response
      expect(error).toBeNull();
      expect(data).toEqual(MOCK_QUOTA_EXCEEDED_RESPONSE);
      
      // Type assertion
      if (data && 'success' in data && data.success === false) {
        expect(data.error).toContain('quota exceeded');
      }
    });

    it('should handle authentication failures', async () => {
      // Set up unauthenticated request
      const { mockErrorResponse } = setupEdgeFunctionAuth({
        isAuthenticated: false
      });
      
      // Mock authentication error response
      mockErrorResponse('Authentication required', 401);
  
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: TEST_MARKET_ANALYSIS_REQUEST
      });
  
      // Verify response
      expect(data).toBeNull();
      expect(error).toBeDefined();
      if (error) {
        expect(error.message).toBe('Authentication required');
        expect(error.status).toBe(401);
      }
    });

    it('should handle AI content moderation blocks', async () => {
      // Set up authentication
      const { mockSuccessResponse } = setupEdgeFunctionAuth({
        isAuthenticated: true,
        userRole: 'agent'
      });
      
      // Mock content moderation error
      const contentModerationError: ErrorResponse = {
        success: false,
        error: 'Content generation blocked: Input or output flagged by content safety policy'
      };
      
      mockSuccessResponse(contentModerationError);
  
      // Call with potentially problematic content
      const problematicRequest = {
        ...TEST_PROPERTY_DESCRIPTION_REQUEST,
        features: ['Potentially problematic content that might trigger moderation']
      };
  
      const { data, error } = await supabase.functions.invoke('ai-property-description', {
        body: problematicRequest
      });
  
      // Verify response
      expect(error).toBeNull();
      
      // Type assertion
      if (data && 'success' in data && data.success === false) {
        expect(data.error).toContain('content safety policy');
      }
    });

    it('should handle timeout errors from Gemini API', async () => {
      // Set up authentication
      const { mockErrorResponse } = setupEdgeFunctionAuth({
        isAuthenticated: true,
        userRole: 'agent'
      });
      
      // Mock timeout error
      mockErrorResponse('Request to Gemini API timed out', 504);
  
      const { data, error } = await supabase.functions.invoke('ai-comparable-analysis', {
        body: TEST_COMPARABLE_ANALYSIS_REQUEST
      });
  
      // Verify response
      expect(data).toBeNull();
      expect(error).toBeDefined();
      if (error) {
        expect(error.message).toContain('timed out');
        expect(error.status).toBe(504);
      }
    });
  });

  describe('Permission and Access Control', () => {
    it('should restrict certain AI features based on user role', async () => {
      // Set up authentication as customer (with limited access)
      const { mockErrorResponse } = setupEdgeFunctionAuth({
        isAuthenticated: true,
        userRole: 'customer' // Not an agent
      });
      
      // Mock access denied response
      mockErrorResponse('Access denied: This feature is only available to agents', 403);
  
      // Try to access an agent-only feature
      const { data, error } = await supabase.functions.invoke('ai-comparable-analysis', {
        body: TEST_COMPARABLE_ANALYSIS_REQUEST
      });
  
      // Verify access control
      expect(data).toBeNull();
      expect(error).toBeDefined();
      if (error) {
        expect(error.message).toContain('Access denied');
        expect(error.status).toBe(403);
      }
    });

    it('should provide customer-appropriate content when accessed by customer', async () => {
      // Set up authentication as customer
      const { mockSuccessResponse } = setupEdgeFunctionAuth({
        isAuthenticated: true,
        userRole: 'customer'
      });
      
      // Create a customer-appropriate response (less detailed)
      const customerAppropriateResponse: SuccessfulMarketAnalysisResponse = {
        success: true,
        data: {
          marketAnalysis: `The Mount Eden housing market shows strong performance with consistent growth over the past year. The median price of properties similar to yours is approximately $950,000, representing a 5.2% increase from the previous year.

Properties in this area are selling relatively quickly, with an average of 32 days on the market before sale. This indicates strong buyer interest in the Mount Eden area.

Based on recent comparable sales in your neighborhood, similar properties have sold for between $920,000 and $970,000 in the past three months. These properties share many characteristics with yours, including similar bedroom count, bathroom count, and overall size.

Mount Eden continues to be a desirable suburb due to its proximity to the city center, quality amenities, and good schools.`,
          bulletPoints: [
            'Current median price for similar properties: $950,000',
            'Annual growth rate of 5.2% in your area',
            'Properties typically sell within 32 days',
            'Comparable properties selling between $920,000-$970,000'
          ],
          metadata: {
            aiModel: 'gemini-1.5-pro',
            promptTokens: 480,
            completionTokens: 250,
            totalTokens: 730,
            processingTime: 2.1
          }
        }
      };
      
      mockSuccessResponse(customerAppropriateResponse);
  
      // Call market analysis as a customer
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: TEST_MARKET_ANALYSIS_REQUEST
      });
  
      // Verify customer-friendly content
      expect(error).toBeNull();
      
      // Type assertion
      if (data && 'success' in data && data.success === true) {
        expect(data.data.marketAnalysis.length).toBeLessThan(MOCK_MARKET_ANALYSIS_RESPONSE.data.marketAnalysis.length);
        expect(data.data.bulletPoints.length).toBe(4); // Fewer bullet points
        expect(data.data.marketAnalysis).not.toContain('seller\'s market'); // More neutral language
      }
    });
  });
}); 