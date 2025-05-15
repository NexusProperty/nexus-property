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

/**
 * Creates a mock Supabase client for testing
 * This can be used to mock the Supabase client in tests
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null,
      }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }),
      refreshSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        match: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        in: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        contains: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
      insert: vi.fn().mockResolvedValue({
        data: { id: 'mock-id' },
        error: null,
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { id: 'mock-id' },
          error: null,
        }),
        match: vi.fn().mockResolvedValue({
          data: { id: 'mock-id' },
          error: null,
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        match: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'mock-path' },
          error: null,
        }),
        download: vi.fn().mockResolvedValue({
          data: new Blob(),
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/mock-file' },
        }),
        remove: vi.fn().mockResolvedValue({
          data: { path: 'mock-path' },
          error: null,
        }),
      }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue({
        unsubscribe: vi.fn(),
      }),
    }),
  };
}

/**
 * Creates a mock session for testing
 */
export function createMockSession(overrides = {}) {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600 * 1000,
    token_type: 'bearer',
    user: createMockUser(),
    ...overrides,
  };
}

/**
 * Creates a mock user for testing
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'mock-user-id',
    email: 'test@example.com',
    app_metadata: { provider: 'email' },
    user_metadata: { 
      full_name: 'Test User', 
      role: 'agent' 
    },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Sets up authentication mocks for tests
 * This provides a more convenient way to mock authentication for tests
 */
export function setupAuthMocks({
  isAuthenticated = false,
  userRole = 'agent',
  userId = 'mock-user-id',
  email = 'test@example.com',
  fullName = 'Test User',
} = {}) {
  const mockUser = isAuthenticated
    ? createMockUser({ 
        id: userId, 
        email, 
        user_metadata: { 
          full_name: fullName, 
          role: userRole 
        } 
      })
    : null;
    
  const mockSession = isAuthenticated
    ? createMockSession({ user: mockUser })
    : null;
  
  const supabase = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: isAuthenticated ? { user: mockUser, session: mockSession } : null,
        error: isAuthenticated ? null : { message: 'Invalid login credentials' },
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null,
      }),
    },
  };
  
  return { supabase, mockUser, mockSession };
}

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