import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { requestPropertyValuation, isEligibleForValuation } from '@/services/property-valuation';
import { supabase } from '@/lib/supabase';
import { mockPropertyValuationData } from '../mocks/property-valuation-data.mock';
import { getAppraisalWithComparables } from '@/services/appraisal';
import { 
  valuationRequestSchema, 
  propertyDetailsSchema,
  comparablePropertySchema,
  valuationResultsSchema 
} from '@/lib/zodSchemas';
import { createValidationErrorResponse } from '@/utils/validationErrors';

// Mocking external dependencies
vi.mock('@/services/appraisal', () => ({
  getAppraisalWithComparables: vi.fn()
}));

vi.mock('@/utils/validationErrors', () => ({
  createValidationErrorResponse: vi.fn().mockImplementation((_, message) => ({
    success: false,
    error: message || 'Validation error',
    data: null
  }))
}));

vi.mock('@/lib/zodSchemas', () => ({
  valuationRequestSchema: {
    shape: {
      appraisalId: {
        safeParse: vi.fn()
      }
    },
    safeParse: vi.fn()
  },
  propertyDetailsSchema: {
    safeParse: vi.fn()
  },
  comparablePropertySchema: {
    safeParse: vi.fn()
  },
  valuationResultsSchema: {
    safeParse: vi.fn()
  }
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
  
  // Mock data
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
    status: 'pending'
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
      metadata: { distance_km: 0.2 }
    },
    {
      id: '2345-6789-abcd-efgh',
      address: '130 Main St',
      suburb: 'Suburbia',
      city: 'Metropolis',
      property_type: 'house',
      bedrooms: 4,
      bathrooms: 2,
      land_size: 550,
      floor_area: 240,
      year_built: 2012,
      sale_date: '2023-02-20',
      sale_price: 820000,
      similarity_score: 82,
      metadata: { distance_km: 0.3 }
    },
    {
      id: '3456-7890-bcde-fghi',
      address: '118 Main St',
      suburb: 'Suburbia',
      city: 'Metropolis',
      property_type: 'house',
      bedrooms: 3,
      bathrooms: 1,
      land_size: 480,
      floor_area: 200,
      year_built: 2005,
      sale_date: '2022-11-10',
      sale_price: 690000,
      similarity_score: 78,
      metadata: { distance_km: 0.25 }
    }
  ];
  
  beforeEach(() => {
    // Set up default behaviors for mocks
    vi.mocked(valuationRequestSchema.shape.appraisalId.safeParse).mockReturnValue({ success: true, data: validAppraisalId });
    vi.mocked(propertyDetailsSchema.safeParse).mockReturnValue({ success: true });
    vi.mocked(comparablePropertySchema.safeParse).mockReturnValue({ success: true });
    vi.mocked(valuationRequestSchema.safeParse).mockReturnValue({ success: true });
    vi.mocked(valuationResultsSchema.safeParse).mockReturnValue({ success: true });
    
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
    
    // Reset data layer mocks
    mockPropertyValuationData.updateAppraisalStatus.mockClear();
    mockPropertyValuationData.updateValuationResults.mockClear();
    mockPropertyValuationData.getValuationEligibility.mockClear();
    
    // Default success for data layer
    mockPropertyValuationData.updateAppraisalStatus.mockResolvedValue({ success: true });
    mockPropertyValuationData.updateValuationResults.mockResolvedValue({ success: true });
    mockPropertyValuationData.getValuationEligibility.mockResolvedValue({
      eligible: true,
      reasons: []
    });
  });
  
  describe('requestPropertyValuation', () => {
    it('should validate appraisal ID format', async () => {
      // Override safeParse for this test to fail
      vi.mocked(valuationRequestSchema.shape.appraisalId.safeParse).mockReturnValueOnce({ 
        success: false 
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
      // Mock invalid property details
      vi.mocked(propertyDetailsSchema.safeParse).mockReturnValueOnce({ success: false });
      
      const result = await requestPropertyValuation(validAppraisalId);
      
      expect(result.success).toBe(false);
    });
    
    it('should successfully process a valid valuation request', async () => {
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
      mockPropertyValuationData.getValuationEligibility.mockResolvedValueOnce({
        eligible: true,
        reasons: []
      });
      
      const result = await isEligibleForValuation(validAppraisalId);
      
      expect(result).toEqual({
        eligible: true,
        reasons: []
      });
      expect(mockPropertyValuationData.getValuationEligibility).toHaveBeenCalledWith(validAppraisalId);
    });
    
    it('should handle errors from data layer', async () => {
      mockPropertyValuationData.getValuationEligibility.mockRejectedValueOnce(
        new Error('Data layer error')
      );
      
      const result = await isEligibleForValuation(validAppraisalId);
      
      expect(result).toEqual({
        eligible: false,
        reasons: ['Data layer error']
      });
    });
  });
}); 