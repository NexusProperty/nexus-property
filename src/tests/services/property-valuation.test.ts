import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { requestPropertyValuation, isEligibleForValuation } from '@/services/property-valuation';
import { supabase } from '@/lib/supabase';
import { getAppraisalWithComparables } from '@/services/appraisal';
import { 
  valuationRequestSchema, 
  propertyDetailsSchema,
  comparablePropertySchema,
  valuationResultsSchema 
} from '@/lib/zodSchemas';
import { createValidationErrorResponse } from '@/utils/validationErrors';
import { PropertyValuationData } from '@/data/property-valuation-data';
import { ZodError } from 'zod';

// Access the mock instance directly from the mocked constructor
// @ts-expect-error - Mock instance is added by our setup.ts
const mockPropertyValuationData = PropertyValuationData.mockInstance;

// Mocking external dependencies
vi.mock('@/services/appraisal', () => ({
  getAppraisalWithComparables: vi.fn()
}));

// Prevent console.error from cluttering the test output
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  vi.clearAllMocks();
});

describe('Property Valuation Service', () => {
  const validAppraisalId = 'abcd1234-5678-efgh-9012-ijklmnopqrst';
  
  // Mock data with all required properties
  const mockAppraisal = {
    id: validAppraisalId,
    property_address: '123 Main St',
    property_suburb: 'Suburbia',
    property_city: 'Metropolis',
    property_type: 'house',
    bedrooms: 3,
    bathrooms: 2,
    land_size: 500,
    floor_area: 220,
    year_built: 2010,
    status: 'pending',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    user_id: 'mock-user-id',
    property_id: 'mock-property-id',
    valuation_low: null,
    valuation_high: null,
    valuation_confidence: null,
    report_url: null,
    analytics: null,
    market_trends: null,
    ai_content: null,
    team_id: null,
    metadata: null,
    severity: null
  };
  
  const mockComparables = [
    {
      id: '1234-5678-90ab-cdef',
      address: '124 Main St',
      suburb: 'Suburbia',
      city: 'Metropolis',
      property_type: 'house',
      bedrooms: 3,
      bathrooms: 2,
      land_size: 520,
      floor_area: 210,
      year_built: 2008,
      sale_date: '2023-01-15',
      sale_price: 750000,
      similarity_score: 89,
      metadata: { distance_km: 0.2 },
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
      appraisal_id: validAppraisalId,
      adjustment_factor: 1.0,
      adjusted_price: 750000,
      notes: null,
      image_url: null
    },
    // ... (other mock comparables with the missing properties)
  ];
  
  beforeEach(() => {
    // Set up default behaviors for mocks
    vi.mocked(valuationRequestSchema.shape.appraisalId.safeParse).mockReturnValue({ 
      success: true, 
      data: validAppraisalId 
    });
    
    vi.mocked(propertyDetailsSchema.safeParse).mockReturnValue({ 
      success: true, 
      data: {} 
    });
    
    vi.mocked(comparablePropertySchema.safeParse).mockReturnValue({ 
      success: true, 
      data: {} 
    });
    
    vi.mocked(valuationRequestSchema.safeParse).mockReturnValue({ 
      success: true, 
      data: {} 
    });
    
    vi.mocked(valuationResultsSchema.safeParse).mockReturnValue({ 
      success: true, 
      data: {} 
    });
    
    // Default successful appraisal fetch
    vi.mocked(getAppraisalWithComparables).mockResolvedValue({
      success: true,
      error: null,
      data: {
        appraisal: mockAppraisal,
        comparables: mockComparables
      }
    });
    
    // Set up default mocks for supabase
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: { 
            id: 'mock-user-id',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2023-01-01T00:00:00.000Z',
            updated_at: '2023-01-01T00:00:00.000Z',
            email: 'test@example.com',
            phone: '',
            confirmed_at: '2023-01-01T00:00:00.000Z',
            last_sign_in_at: '2023-01-01T00:00:00.000Z',
            role: 'authenticated',
            confirmation_sent_at: '2023-01-01T00:00:00.000Z',
            recovery_sent_at: '2023-01-01T00:00:00.000Z'
          }
        }
      },
      error: null
    });
    
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        success: true,
        data: {
          valuationLow: 700000,
          valuationHigh: 850000,
          valuationConfidence: 85,
          adjustedComparables: [],
          valuationFactors: {},
          marketTrends: {
            medianPrice: 750000,
            pricePerSqm: 3500,
            annualGrowth: 5.2
          }
        }
      },
      error: null
    });
    
    // Reset PropertyValuationData mocks
    if (mockPropertyValuationData) {
      mockPropertyValuationData.updateAppraisalStatus.mockClear();
      mockPropertyValuationData.updateValuationResults.mockClear();
      mockPropertyValuationData.getValuationEligibility.mockClear();
    }
  });
  
  describe('requestPropertyValuation', () => {
    it('should validate appraisal ID format', async () => {
      // Create a proper ZodError instance for the mock
      const mockZodError = new ZodError([{
        code: 'invalid_string',
        message: 'Invalid UUID format',
        path: ['appraisalId'],
        validation: 'uuid'
      }]);
      
      // Override safeParse for this test to fail with proper ZodError
      vi.mocked(valuationRequestSchema.shape.appraisalId.safeParse).mockReturnValueOnce({ 
        success: false,
        error: mockZodError
      });
      
      const result = await requestPropertyValuation('invalid-uuid');
      
      expect(result.success).toBe(false);
      expect(mockPropertyValuationData.updateAppraisalStatus).not.toHaveBeenCalled();
    });
    
    it('should fail if user is not authenticated', async () => {
      // Make auth session return null
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null
      });
      
      const result = await requestPropertyValuation(validAppraisalId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
    
    it('should fail if appraisal data cannot be fetched', async () => {
      // Mock appraisal fetch failure
      vi.mocked(getAppraisalWithComparables).mockResolvedValueOnce({
        success: false,
        error: 'Failed to fetch appraisal',
        data: null
      });
      
      const result = await requestPropertyValuation(validAppraisalId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch appraisal');
    });
    
    it('should validate property details', async () => {
      // Create a proper ZodError instance for the mock
      const mockZodError = new ZodError([{
        code: 'invalid_type',
        message: 'Property details validation failed',
        path: ['address'],
        expected: 'string',
        received: 'undefined'
      }]);
      
      // Mock invalid property details with proper ZodError
      vi.mocked(propertyDetailsSchema.safeParse).mockReturnValueOnce({ 
        success: false,
        error: mockZodError
      });
      
      const result = await requestPropertyValuation(validAppraisalId);
      
      expect(result.success).toBe(false);
    });
    
    it.skip('should successfully process a valid valuation request', async () => {
      // Setup mock responses
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            valuationLow: 700000,
            valuationHigh: 850000,
            valuationConfidence: 85,
            adjustedComparables: [],
            valuationFactors: {},
            marketTrends: {
              medianPrice: 750000,
              pricePerSqm: 3500,
              annualGrowth: 5.2
            }
          }
        },
        error: null
      });
      
      // Mock the validation response
      vi.mocked(valuationResultsSchema.safeParse).mockReturnValueOnce({
        success: true,
        data: {
          valuationLow: 700000,
          valuationHigh: 850000,
          valuationConfidence: 85
        }
      });
      
      const result = await requestPropertyValuation(validAppraisalId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      // Check that all the right methods were called
      expect(mockPropertyValuationData.updateAppraisalStatus).toHaveBeenCalledWith(
        validAppraisalId,
        'awaiting_valuation',
        expect.any(Object)
      );
      
      expect(mockPropertyValuationData.updateValuationResults).toHaveBeenCalledWith(
        validAppraisalId,
        {
          valuationLow: 700000,
          valuationHigh: 850000,
          valuationConfidence: 85
        }
      );
      
      expect(mockPropertyValuationData.updateAppraisalStatus).toHaveBeenCalledWith(
        validAppraisalId,
        'valuation_complete',
        expect.any(Object)
      );
    });
  });
  
  describe('isEligibleForValuation', () => {
    it('should return eligibility status from data layer', async () => {
      if (mockPropertyValuationData) {
        mockPropertyValuationData.getValuationEligibility.mockResolvedValueOnce({
          eligible: true,
          reasons: []
        });
      }
      
      const result = await isEligibleForValuation(validAppraisalId);
      
      expect(result).toEqual({
        eligible: true,
        reasons: []
      });
      
      if (mockPropertyValuationData) {
        expect(mockPropertyValuationData.getValuationEligibility).toHaveBeenCalledWith(validAppraisalId);
      }
    });
    
    it('should handle errors from data layer', async () => {
      if (mockPropertyValuationData) {
        mockPropertyValuationData.getValuationEligibility.mockRejectedValueOnce(new Error('Data layer error'));
      }
      
      const result = await isEligibleForValuation(validAppraisalId);
      
      expect(result).toEqual({
        eligible: false,
        reasons: ['Data layer error']
      });
    });
  });
}); 