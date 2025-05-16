import { supabase } from '@/lib/supabase';
import { vi } from 'vitest';
import { mockData } from './supabase-test-utils';

// Type for mock tables
type MockTableData = Record<string, DbItem[]>;

// Item type represents a generic database item
interface DbItem {
  id: string;
  [key: string]: unknown;
}

// Mock supabase query result type
interface MockQueryResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Configure an isolated test database for database integration tests
 * This sets up the database connection to use a test database with
 * pre-seeded data that won't affect the main development database
 */
export async function setupTestDatabase() {
  // In a real implementation, this would connect to a dedicated test database
  // For now, we'll use mock data and functions
  
  // Mock data tables for common entities
  const mockTables: MockTableData = {
    'properties': [...mockData.properties] as DbItem[],
    'appraisals': [...mockData.appraisals] as DbItem[],
    'users': [...mockData.users] as DbItem[],
    'comparable_properties': [
      {
        id: 'comp-1',
        appraisal_id: 'test-appraisal-id-1',
        address: '125 Test Street',
        city: 'Auckland',
        sale_price: 800000,
        sale_date: '2023-01-05T00:00:00.000Z',
        similarity_score: 90
      },
      {
        id: 'comp-2',
        appraisal_id: 'test-appraisal-id-1',
        address: '127 Test Street',
        city: 'Auckland',
        sale_price: 820000,
        sale_date: '2023-01-10T00:00:00.000Z',
        similarity_score: 85
      }
    ] as DbItem[],
    'reports': [
      {
        id: 'report-1',
        appraisal_id: 'test-appraisal-id-1',
        user_id: 'test-user-id-1',
        url: 'https://example.com/reports/report-1.pdf',
        created_at: '2023-01-15T00:00:00.000Z',
        expires_at: '2023-02-15T00:00:00.000Z'
      }
    ] as DbItem[]
  };
  
  // Mock the Supabase database interface
  vi.mocked(supabase.from).mockImplementation((tableName: string) => {
    const tableData = mockTables[tableName] || [];
    
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn((column: string, value: unknown) => ({
          data: tableData.filter(item => item[column as keyof typeof item] === value),
          error: null,
          single: vi.fn().mockImplementation(() => {
            const item = tableData.find(item => item[column as keyof typeof item] === value);
            return { data: item || null, error: item ? null : { message: 'Not found' } };
          })
        })),
        match: vi.fn((conditions: Record<string, unknown>) => {
          const matchedItems = tableData.filter(item => {
            return Object.entries(conditions).every(([key, value]) => item[key as keyof typeof item] === value);
          });
          return { data: matchedItems, error: null };
        }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockImplementation((start, end) => ({
          data: tableData.slice(start, end + 1),
          error: null
        })),
        maybeSingle: vi.fn().mockImplementation(() => {
          return { data: tableData[0] || null, error: null };
        }),
        single: vi.fn().mockImplementation(() => {
          return { data: tableData[0] || null, error: tableData.length === 0 ? { message: 'Not found' } : null };
        }),
      }),
      insert: vi.fn((newData: Record<string, unknown> | Record<string, unknown>[]) => {
        const insertedData = Array.isArray(newData) 
          ? newData.map((item, i) => ({ id: `new-${i}`, ...item }))
          : { id: 'new-id', ...newData };
        
        if (Array.isArray(newData)) {
          if (mockTables[tableName]) {
            mockTables[tableName].push(...(insertedData as DbItem[]));
          }
        } else {
          if (mockTables[tableName]) {
            mockTables[tableName].push(insertedData as DbItem);
          }
        }
        
        return { data: insertedData, error: null };
      }),
      update: vi.fn((updateData: Record<string, unknown>) => ({
        eq: vi.fn((column: string, value: unknown) => {
          const index = tableData.findIndex(item => item[column as keyof typeof item] === value);
          if (index !== -1) {
            tableData[index] = { ...tableData[index], ...updateData };
          }
          return { data: index !== -1 ? tableData[index] : null, error: index === -1 ? { message: 'Not found' } : null };
        }),
        match: vi.fn((conditions: Record<string, unknown>) => {
          const indices = tableData
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => {
              return Object.entries(conditions).every(([key, value]) => item[key as keyof typeof item] === value);
            })
            .map(({ index }) => index);
          
          indices.forEach(index => {
            tableData[index] = { ...tableData[index], ...updateData };
          });
          
          return { 
            data: indices.map(index => tableData[index]), 
            error: indices.length === 0 ? { message: 'No matching records' } : null 
          };
        })
      })),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn((column: string, value: unknown) => {
          const index = tableData.findIndex(item => item[column as keyof typeof item] === value);
          const deleted = index !== -1 ? tableData.splice(index, 1)[0] : null;
          return { data: deleted, error: deleted ? null : { message: 'Not found' } };
        }),
        match: vi.fn((conditions: Record<string, unknown>) => {
          const before = tableData.length;
          const newData = tableData.filter(item => {
            return !Object.entries(conditions).every(([key, value]) => item[key as keyof typeof item] === value);
          });
          
          if (mockTables[tableName]) {
            mockTables[tableName] = newData;
          }
          
          const count = before - newData.length;
          return { data: { count }, error: null };
        })
      })
    };
  });
  
  return {
    cleanup: async () => {
      // Reset the mock tables to initial state
      Object.keys(mockTables).forEach(key => {
        const initialData = key === 'properties' ? mockData.properties as DbItem[] :
                          key === 'appraisals' ? mockData.appraisals as DbItem[] :
                          key === 'users' ? mockData.users as DbItem[] : 
                          [] as DbItem[];
        
        mockTables[key] = [...initialData];
      });
    },
    seedData: async (table: string, data: DbItem[]) => {
      mockTables[table] = [...data];
    },
    getMockData: (table: string): DbItem[] => {
      return mockTables[table] || [];
    }
  };
}

// Define RLS policy check function type
type RlsPolicyCheck = (userId: string, userRole: string, item: DbItem) => boolean;

// Define RLS policies interface
interface RlsPolicies {
  [table: string]: {
    select: RlsPolicyCheck;
    insert: (userId: string) => boolean;
    update: RlsPolicyCheck;
    delete: RlsPolicyCheck;
  };
}

// Mock RLS-enforced client return type
interface MockRlsReturn {
  select: () => Record<string, unknown>;
  update: (data: Record<string, unknown>) => Record<string, unknown>;
  delete: () => Record<string, unknown>;
}

/**
 * Setup RLS policy testing environment
 * Tests row-level security policies by simulating different user contexts
 */
export function setupRLSTesting() {
  // Set up mock functions that simulate RLS enforcement
  
  // Define RLS policy checks for common tables
  const rlsPolicies: RlsPolicies = {
    properties: {
      select: (userId: string, userRole: string, item: DbItem) => item.user_id === userId || item.public === true,
      insert: (userId: string) => true,
      update: (userId: string, userRole: string, item: DbItem) => item.user_id === userId,
      delete: (userId: string, userRole: string, item: DbItem) => item.user_id === userId
    },
    appraisals: {
      select: (userId: string, userRole: string, item: DbItem) => {
        if (userRole === 'admin') return true;
        return item.user_id === userId;
      },
      insert: (userId: string) => true,
      update: (userId: string, userRole: string, item: DbItem) => {
        if (userRole === 'admin') return true;
        return item.user_id === userId;
      },
      delete: (userId: string, userRole: string, item: DbItem) => {
        if (userRole === 'admin') return true;
        return item.user_id === userId;
      }
    }
  };
  
  // Mock database querying with RLS enforcement
  
  // Helper function to simulate RLS-enforced database query
  const queryWithRls = (
    item: unknown,
    policyCheck: RlsPolicyCheck,
    userId: string,
    userRole: string
  ): MockQueryResult<unknown> => {
    if (!item) {
      return { data: null, error: null };
    }
    
    const allowed = policyCheck(userId, userRole, item as DbItem);
    return {
      data: allowed ? item : null,
      error: allowed ? null : { message: 'RLS policy denied access' } as Error
    };
  };
  
  // Function to mock requests as a specific user
  const asUser = (userId: string, userRole = 'customer') => {
    // Create a wrapper around supabase client that enforces RLS policies
    return {
      from: (tableName: string): MockRlsReturn => {
        // Apply RLS policies to the appropriate table methods
        const policies = rlsPolicies[tableName as keyof typeof rlsPolicies];
        
        if (!policies) {
          // If no policies defined, return a basic mock implementation
          return {
            select: () => ({}),
            update: () => ({}),
            delete: () => ({})
          };
        }
        
        // Mock select method with RLS enforcement
        const mockSelect = () => ({
          eq: (column: string, value: unknown) => {
            // Mock getting data from the database
            const mockData = { id: 'mock-id', [column]: value, user_id: 'some-user-id' };
            
            // Apply RLS policy
            return queryWithRls(mockData, policies.select, userId, userRole);
          },
          single: () => {
            // Mock getting a single item
            const mockData = { id: 'mock-id', user_id: 'some-user-id' };
            
            // Apply RLS policy
            return queryWithRls(mockData, policies.select, userId, userRole);
          }
        });
        
        // Mock update method with RLS enforcement
        const mockUpdate = (updateData: Record<string, unknown>) => ({
          eq: (column: string, value: unknown) => {
            // Mock getting the item to check RLS policy
            const mockItem = { id: 'mock-id', [column]: value, user_id: 'some-user-id' };
            
            // Check RLS policy
            const allowed = policies.update(userId, userRole, mockItem as DbItem);
            if (!allowed) {
              return { data: null, error: { message: 'RLS policy denied update' } };
            }
            
            // Return mock updated data
            return { data: { ...mockItem, ...updateData }, error: null };
          }
        });
        
        // Mock delete method with RLS enforcement
        const mockDelete = () => ({
          eq: (column: string, value: unknown) => {
            // Mock getting the item to check RLS policy
            const mockItem = { id: 'mock-id', [column]: value, user_id: 'some-user-id' };
            
            // Check RLS policy
            const allowed = policies.delete(userId, userRole, mockItem as DbItem);
            if (!allowed) {
              return { data: null, error: { message: 'RLS policy denied delete' } };
            }
            
            // Return mock deleted data
            return { data: mockItem, error: null };
          }
        });
        
        // Apply RLS enforcement to each method
        return {
          select: mockSelect,
          update: mockUpdate,
          delete: mockDelete
        };
      }
    };
  };
  
  return { asUser };
}

/**
 * Execute database queries safely for testing
 * This wraps database operations in try/catch and provides consistent error handling
 */
export async function safeDbQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown | null }>,
  errorMsg = 'Database query failed'
): Promise<T> {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      throw new Error(`${errorMsg}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    if (data === null) {
      throw new Error(`${errorMsg}: No data returned`);
    }
    
    return data as T;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`${errorMsg}: ${errorMessage}`);
  }
} 