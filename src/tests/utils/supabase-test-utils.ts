import { vi } from 'vitest';

// Mock data factory
export const mockData = {
  users: [
    {
      id: 'test-user-id-1',
      email: 'user1@example.com',
      role: 'agent',
      created_at: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 'test-user-id-2', 
      email: 'user2@example.com',
      role: 'customer',
      created_at: '2023-01-02T00:00:00.000Z',
    },
  ],
  properties: [
    {
      id: 'test-property-id-1',
      address: '123 Test Street',
      city: 'Auckland',
      bedrooms: 3,
      bathrooms: 2,
      land_size: 500,
      created_at: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 'test-property-id-2',
      address: '456 Sample Avenue',
      city: 'Wellington',
      bedrooms: 4,
      bathrooms: 3,
      land_size: 600,
      created_at: '2023-01-02T00:00:00.000Z',
    },
  ],
  appraisals: [
    {
      id: 'test-appraisal-id-1',
      property_id: 'test-property-id-1',
      user_id: 'test-user-id-1',
      status: 'completed',
      valuation_low: 750000,
      valuation_high: 850000,
      created_at: '2023-01-03T00:00:00.000Z',
    },
    {
      id: 'test-appraisal-id-2',
      property_id: 'test-property-id-2',
      user_id: 'test-user-id-2',
      status: 'pending',
      created_at: '2023-01-04T00:00:00.000Z',
    },
  ],
};

// Create a mock for database queries
const createMockQuery = (tableName: string) => {
  const tableData = mockData[tableName as keyof typeof mockData] || [];
  
  // Create a mock query builder that returns data based on filters
  return {
    select: vi.fn(() => ({
      eq: vi.fn((column, value) => ({
        single: vi.fn().mockImplementation(() => {
          const result = tableData.find(item => item[column] === value);
          return { data: result, error: result ? null : { message: 'Not found' } };
        }),
        limit: vi.fn((limit) => ({
          order: vi.fn(() => ({
            range: vi.fn().mockImplementation(() => ({
              data: tableData.filter(item => item[column] === value).slice(0, limit),
              error: null
            })),
          })),
          range: vi.fn().mockImplementation(() => ({
            data: tableData.filter(item => item[column] === value).slice(0, limit),
            error: null
          })),
        })),
        order: vi.fn(() => ({
          data: tableData.filter(item => item[column] === value),
          error: null
        })),
      })),
      order: vi.fn(() => ({
        range: vi.fn().mockImplementation(() => ({
          data: [...tableData],
          error: null
        })),
      })),
      limit: vi.fn(() => ({
        range: vi.fn().mockImplementation(() => ({
          data: [...tableData],
          error: null
        })),
      })),
    })),
    insert: vi.fn().mockImplementation((newData) => {
      return { 
        data: Array.isArray(newData) 
          ? newData.map((item, index) => ({ ...item, id: `new-${tableName}-id-${index}` }))
          : { ...newData, id: `new-${tableName}-id` }, 
        error: null 
      };
    }),
    update: vi.fn().mockImplementation((updateData) => ({
      eq: vi.fn((column, value) => {
        return { 
          data: { ...updateData, id: value }, 
          error: null 
        };
      }),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn((column, value) => ({ 
        data: { id: value },
        error: null 
      })),
    })),
  };
};

// Create a mock Supabase client
export const createMockSupabaseClient = () => {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ 
        data: { 
          session: { 
            user: { 
              id: 'test-user-id-1', 
              email: 'test@example.com',
              user_metadata: { role: 'agent' }
            },
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            token_type: 'bearer'
          } 
        }, 
        error: null 
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: mockData.users[0], session: { access_token: 'mock-token' } },
        error: null
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: { ...mockData.users[0], id: 'new-user-id' }, session: { access_token: 'mock-token' } },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      refreshSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { 
              id: 'test-user-id-1', 
              email: 'test@example.com',
              user_metadata: { role: 'agent' }
            },
            access_token: 'mock-fresh-access-token',
            refresh_token: 'mock-fresh-refresh-token',
            expires_in: 3600,
            token_type: 'bearer'
          }
        },
        error: null
      }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: mockData.users[0] },
        error: null
      }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: {},
        error: null
      }),
    },
    from: vi.fn((tableName) => createMockQuery(tableName)),
    functions: {
      invoke: vi.fn().mockImplementation((functionName, { body } = { body: {} }) => {
        // Mock different function responses
        if (functionName === 'property-data') {
          return Promise.resolve({
            data: { 
              property: mockData.properties[0],
              comparables: mockData.properties.slice(1),
              success: true
            },
            error: null
          });
        } else if (functionName === 'property-valuation') {
          return Promise.resolve({
            data: {
              valuationLow: 750000,
              valuationHigh: 850000,
              valuationConfidence: 85,
              success: true
            },
            error: null
          });
        } else if (functionName === 'ai-market-analysis') {
          return Promise.resolve({
            data: {
              marketTrends: 'Property prices are increasing by 5% annually in this area.',
              localFeatures: 'Close to schools, parks, and shopping centers.',
              success: true
            },
            error: null
          });
        }
        
        return Promise.resolve({ data: null, error: { message: 'Function not implemented in test' } });
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-file-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test-file.jpg' } }),
        list: vi.fn().mockResolvedValue({ data: [{ name: 'test-file.jpg' }], error: null }),
        remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    },
  };
};

// Utility to mock Edge Function responses
export const mockEdgeFunction = (
  functionName: string, 
  mockResponse: Record<string, unknown>,
  shouldFail = false
) => {
  return vi.fn().mockImplementation((name: string) => {
    if (name === functionName) {
      return Promise.resolve({
        data: shouldFail ? null : mockResponse,
        error: shouldFail ? { message: 'Mock function error' } : null
      });
    }
    return Promise.resolve({ 
      data: null, 
      error: { message: 'Function not mocked' } 
    });
  });
}; 