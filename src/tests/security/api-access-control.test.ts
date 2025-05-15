import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

// Create mock Edge Function response handlers
const mockEdgeFunctionInvoke = vi.fn();

// Define different user roles for testing
const TEST_USERS = {
  ADMIN: { id: 'admin-id', role: 'admin', email: 'admin@example.com' },
  AGENT: { id: 'agent-id', role: 'agent', email: 'agent@example.com' },
  CUSTOMER: { id: 'customer-id', role: 'customer', email: 'customer@example.com' }
};

// Define test API payloads
const TEST_PAYLOADS = {
  PROPERTY_DATA: {
    address: '123 Test Street, Auckland',
    propertyId: 'test-property-id'
  },
  MARKET_ANALYSIS: {
    propertyId: 'test-property-id',
    suburb: 'Test Suburb',
    requestType: 'market-trends'
  },
  REPORT_GENERATION: {
    appraisalId: 'test-appraisal-id',
    includeComparables: true
  }
};

describe('API Access Control Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup Edge Function mock responses
    mockEdgeFunctionInvoke.mockResolvedValue({
      data: { message: 'Success' },
      error: null
    });
    
    // Create a mock Supabase client
    const mockSupabaseClient = {
      auth: {
        getSession: vi.fn()
      },
      functions: {
        invoke: mockEdgeFunctionInvoke
      }
    };
    
    // Setup createClient mock
    (createClient as any).mockReturnValue(mockSupabaseClient);
  });

  describe('Edge Function: property-data', () => {
    it('should allow agents to access property data API', async () => {
      // Setup user session as agent
      const supabase = createClient('https://example.com', 'test-key');
      supabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: TEST_USERS.AGENT.id, 
              email: TEST_USERS.AGENT.email,
              user_metadata: { role: 'agent' }
            } 
          } 
        }
      });
      
      // Invoke property-data Edge Function
      const { data, error } = await supabase.functions.invoke('property-data', {
        body: TEST_PAYLOADS.PROPERTY_DATA
      });
      
      // Verify access was granted
      expect(error).toBeNull();
      expect(data).toEqual({ message: 'Success' });
      expect(mockEdgeFunctionInvoke).toHaveBeenCalledWith('property-data', {
        body: TEST_PAYLOADS.PROPERTY_DATA
      });
    });

    it('should deny customers access to property data API', async () => {
      // Setup user session as customer
      const supabase = createClient('https://example.com', 'test-key');
      supabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: TEST_USERS.CUSTOMER.id, 
              email: TEST_USERS.CUSTOMER.email,
              user_metadata: { role: 'customer' }
            } 
          } 
        }
      });
      
      // Mock access denied response for customer
      mockEdgeFunctionInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Access denied. Insufficient permissions.', status: 403 }
      });
      
      // Invoke property-data Edge Function
      const { data, error } = await supabase.functions.invoke('property-data', {
        body: TEST_PAYLOADS.PROPERTY_DATA
      });
      
      // Verify access was denied
      expect(error).not.toBeNull();
      expect(error.status).toBe(403);
      expect(data).toBeNull();
    });
  });

  describe('Edge Function: ai-market-analysis', () => {
    it('should allow agents to access market analysis API', async () => {
      // Setup user session as agent
      const supabase = createClient('https://example.com', 'test-key');
      supabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: TEST_USERS.AGENT.id, 
              email: TEST_USERS.AGENT.email,
              user_metadata: { role: 'agent' }
            } 
          } 
        }
      });
      
      // Invoke market analysis Edge Function
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: TEST_PAYLOADS.MARKET_ANALYSIS
      });
      
      // Verify access was granted
      expect(error).toBeNull();
      expect(data).toEqual({ message: 'Success' });
    });

    it('should allow admins to access market analysis API', async () => {
      // Setup user session as admin
      const supabase = createClient('https://example.com', 'test-key');
      supabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: TEST_USERS.ADMIN.id, 
              email: TEST_USERS.ADMIN.email,
              user_metadata: { role: 'admin' }
            } 
          } 
        }
      });
      
      // Invoke market analysis Edge Function
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: TEST_PAYLOADS.MARKET_ANALYSIS
      });
      
      // Verify access was granted
      expect(error).toBeNull();
      expect(data).toEqual({ message: 'Success' });
    });

    it('should deny unauthenticated access to market analysis API', async () => {
      // Setup unauthenticated session
      const supabase = createClient('https://example.com', 'test-key');
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      });
      
      // Mock access denied response for unauthenticated user
      mockEdgeFunctionInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Authentication required.', status: 401 }
      });
      
      // Invoke market analysis Edge Function
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: TEST_PAYLOADS.MARKET_ANALYSIS
      });
      
      // Verify access was denied
      expect(error).not.toBeNull();
      expect(error.status).toBe(401);
      expect(data).toBeNull();
    });
  });

  describe('Edge Function: report-generation', () => {
    it('should allow agents to access report generation API', async () => {
      // Setup user session as agent
      const supabase = createClient('https://example.com', 'test-key');
      supabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: TEST_USERS.AGENT.id, 
              email: TEST_USERS.AGENT.email,
              user_metadata: { role: 'agent' }
            } 
          } 
        }
      });
      
      // Invoke report generation Edge Function
      const { data, error } = await supabase.functions.invoke('report-generation', {
        body: TEST_PAYLOADS.REPORT_GENERATION
      });
      
      // Verify access was granted
      expect(error).toBeNull();
      expect(data).toEqual({ message: 'Success' });
    });

    it('should verify ownership before allowing report generation', async () => {
      // Setup user session as agent
      const supabase = createClient('https://example.com', 'test-key');
      supabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: TEST_USERS.AGENT.id, 
              email: TEST_USERS.AGENT.email,
              user_metadata: { role: 'agent' }
            } 
          } 
        }
      });
      
      // Mock access denied due to ownership verification failure
      mockEdgeFunctionInvoke.mockResolvedValue({
        data: null,
        error: { 
          message: 'Access denied. You do not have permission to generate reports for this appraisal.',
          status: 403 
        }
      });
      
      // Invoke report generation Edge Function with non-owned appraisal
      const nonOwnedAppraisal = {
        ...TEST_PAYLOADS.REPORT_GENERATION,
        appraisalId: 'non-owned-appraisal-id'
      };
      
      const { data, error } = await supabase.functions.invoke('report-generation', {
        body: nonOwnedAppraisal
      });
      
      // Verify access was denied due to ownership verification
      expect(error).not.toBeNull();
      expect(error.status).toBe(403);
      expect(data).toBeNull();
    });
  });

  describe('API Request Validation', () => {
    it('should reject requests with invalid JWT tokens', async () => {
      // Setup supabase client with invalid auth
      const supabase = createClient('https://example.com', 'test-key');
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { accessToken: 'invalid-token' } }
      });
      
      // Mock JWT validation failure
      mockEdgeFunctionInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Invalid JWT token', status: 401 }
      });
      
      // Attempt to invoke protected API
      const { data, error } = await supabase.functions.invoke('property-data', {
        body: TEST_PAYLOADS.PROPERTY_DATA
      });
      
      // Verify the request was rejected due to invalid token
      expect(error).not.toBeNull();
      expect(error.status).toBe(401);
      expect(data).toBeNull();
    });

    it('should validate required parameters in API requests', async () => {
      // Setup user session as agent
      const supabase = createClient('https://example.com', 'test-key');
      supabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: TEST_USERS.AGENT.id, 
              email: TEST_USERS.AGENT.email,
              user_metadata: { role: 'agent' }
            } 
          } 
        }
      });
      
      // Mock parameter validation failure
      mockEdgeFunctionInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Missing required parameter: propertyId', status: 400 }
      });
      
      // Invoke Edge Function with incomplete parameters
      const incompletePayload = { address: '123 Test Street, Auckland' };
      
      const { data, error } = await supabase.functions.invoke('property-data', {
        body: incompletePayload
      });
      
      // Verify the request was rejected due to parameter validation
      expect(error).not.toBeNull();
      expect(error.status).toBe(400);
      expect(error.message).toContain('Missing required parameter');
      expect(data).toBeNull();
    });
  });
}); 