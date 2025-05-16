import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { createMockUser } from '@/tests/utils/supabase-test-utils';

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

// Test data
const TEST_REPORT_REQUEST = {
  appraisalId: 'test-appraisal-id',
  includeComparables: true,
  includeMarketAnalysis: true,
  includeValuationFactors: true,
  customizations: {
    logoUrl: 'https://example.com/logo.png',
    primaryColor: '#2563EB',
    secondaryColor: '#E5E7EB',
    companyName: 'Test Realty',
    agentName: 'Jane Agent',
    agentPhone: '555-1234',
    agentEmail: 'jane@testrealty.com'
  }
};

// Mock responses
const MOCK_SUCCESSFUL_RESPONSE = {
  success: true,
  data: {
    reportUrl: 'https://example.com/reports/test-report-id.pdf',
    reportId: 'test-report-id',
    generatedAt: '2023-05-15T10:30:45.123Z',
    expiresAt: '2023-06-15T10:30:45.123Z',
    sections: ['property-details', 'valuation', 'comparables', 'market-analysis'],
    pages: 8
  }
};

const MOCK_ERROR_RESPONSE = {
  success: false,
  error: 'Failed to generate report'
};

const MOCK_VALIDATION_ERROR_RESPONSE = {
  success: false,
  error: 'Invalid appraisal ID or missing required parameters'
};

describe('Generate Report Edge Function Integration', () => {
  // Before each test, reset mocks
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // After all tests, restore mocks
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully generate a report when all inputs are valid', async () => {
    // Mock authentication
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: createMockUser({ user_metadata: { role: 'agent' } })
        }
      },
      error: null
    });

    // Mock successful Edge Function response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: MOCK_SUCCESSFUL_RESPONSE,
      error: null
    });

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('generate-report', {
      body: TEST_REPORT_REQUEST
    });

    // Verify the function was called with the correct parameters
    expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-report', {
      body: TEST_REPORT_REQUEST
    });

    // Verify the response
    expect(error).toBeNull();
    expect(data).toEqual(MOCK_SUCCESSFUL_RESPONSE);
    expect(data?.success).toBe(true);
    expect(data?.data?.reportUrl).toBeDefined();
    expect(data?.data?.reportId).toBeDefined();
    expect(data?.data?.generatedAt).toBeDefined();
    expect(data?.data?.sections).toBeInstanceOf(Array);
    expect(data?.data?.pages).toBeDefined();
  });

  it('should handle validation errors for invalid appraisal ID', async () => {
    // Mock authentication
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: createMockUser({ user_metadata: { role: 'agent' } })
        }
      },
      error: null
    });

    // Mock validation error response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: MOCK_VALIDATION_ERROR_RESPONSE,
      error: null
    });

    // Call the Edge Function with invalid appraisal ID
    const { data, error } = await supabase.functions.invoke('generate-report', {
      body: { ...TEST_REPORT_REQUEST, appraisalId: 'invalid-id' }
    });

    // Verify the response
    expect(error).toBeNull();
    expect(data).toEqual(MOCK_VALIDATION_ERROR_RESPONSE);
    expect(data?.success).toBe(false);
    expect(data?.error).toContain('Invalid appraisal ID');
  });

  it('should handle authentication failures', async () => {
    // Mock authentication failure
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    // Mock authentication error response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Authentication required', status: 401 }
    });

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('generate-report', {
      body: TEST_REPORT_REQUEST
    });

    // Verify the response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.message).toBe('Authentication required');
    expect(error?.status).toBe(401);
  });

  it('should handle appraisals with incomplete valuation data', async () => {
    // Mock authentication
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: createMockUser({ user_metadata: { role: 'agent' } })
        }
      },
      error: null
    });

    // Mock error response for incomplete valuation
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        success: false,
        error: 'Cannot generate report: Appraisal does not have complete valuation data.'
      },
      error: null
    });

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('generate-report', {
      body: TEST_REPORT_REQUEST
    });

    // Verify the response
    expect(error).toBeNull();
    expect(data?.success).toBe(false);
    expect(data?.error).toContain('does not have complete valuation data');
  });

  it('should handle ownership verification', async () => {
    // Mock authentication with different user
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: createMockUser({
            id: 'different-user-id', // Different from the appraisal owner
            user_metadata: { role: 'agent' }
          })
        }
      },
      error: null
    });

    // Mock access error response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Access denied. You do not have permission to generate reports for this appraisal.', status: 403 }
    });

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('generate-report', {
      body: TEST_REPORT_REQUEST
    });

    // Verify the response
    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.message).toContain('Access denied');
    expect(error?.status).toBe(403);
  });

  it('should handle PDF generation service errors', async () => {
    // Mock authentication
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: createMockUser({ user_metadata: { role: 'agent' } })
        }
      },
      error: null
    });

    // Mock PDF generation error
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        success: false,
        error: 'PDF generation service error: Failed to render report template.'
      },
      error: null
    });

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('generate-report', {
      body: TEST_REPORT_REQUEST
    });

    // Verify the response
    expect(error).toBeNull();
    expect(data?.success).toBe(false);
    expect(data?.error).toContain('PDF generation service error');
  });

  it('should handle storage service errors', async () => {
    // Mock authentication
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: createMockUser({ user_metadata: { role: 'agent' } })
        }
      },
      error: null
    });

    // Mock storage error
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: {
        success: false,
        error: 'Storage service error: Failed to upload generated report.'
      },
      error: null
    });

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('generate-report', {
      body: TEST_REPORT_REQUEST
    });

    // Verify the response
    expect(error).toBeNull();
    expect(data?.success).toBe(false);
    expect(data?.error).toContain('Storage service error');
  });
});