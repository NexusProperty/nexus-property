import { vi } from 'vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Setup global mocks and configurations
beforeAll(() => {
  // Add any global test setup here
  console.log('Setting up test environment');
});

// Clean up after all tests
afterAll(() => {
  // Add any global test teardown here
  console.log('Tearing down test environment');
});

// Reset mocks after each test
afterEach(() => {
  vi.restoreAllMocks();
});

// Create a global mock for Zod validation
vi.mock('@/lib/zodSchemas', () => {
  return {
    propertyDetailsSchema: {
      safeParse: vi.fn().mockImplementation((data) => {
        // Validate address is non-empty
        if (!data.address || data.address.length < 5) {
          return { 
            success: false, 
            error: {
              errors: [{ message: 'Property address is required', path: ['address'] }]
            }
          };
        }
        return { success: true, data };
      })
    },
    comparablePropertySchema: {
      safeParse: vi.fn().mockImplementation((data) => {
        // Validate ID is a UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!data.id || !uuidRegex.test(data.id)) {
          return { 
            success: false, 
            error: {
              errors: [{ message: 'Invalid property ID format', path: ['id'] }]
            }
          };
        }
        return { success: true, data };
      })
    },
    valuationRequestSchema: {
      safeParse: vi.fn().mockImplementation((data) => {
        // Validate appraisalId is a UUID and has at least 3 comparables
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (!data.appraisalId || !uuidRegex.test(data.appraisalId)) {
          return { 
            success: false, 
            error: {
              errors: [{ message: 'Invalid appraisal ID format', path: ['appraisalId'] }]
            }
          };
        }
        
        if (!data.comparableProperties || data.comparableProperties.length < 3) {
          return { 
            success: false, 
            error: {
              errors: [{ message: 'At least 3 comparable properties are required', path: ['comparableProperties'] }]
            }
          };
        }
        
        return { success: true, data };
      }),
      shape: {
        appraisalId: {
          safeParse: vi.fn().mockImplementation((id) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!id || !uuidRegex.test(id)) {
              return { 
                success: false, 
                error: {
                  errors: [{ message: 'Invalid appraisal ID format', path: ['appraisalId'] }]
                }
              };
            }
            return { success: true, data: id };
          })
        }
      }
    },
    valuationResultsSchema: {
      safeParse: vi.fn().mockImplementation((data) => {
        // Validate valuation amounts are positive
        if (data.valuationLow < 0 || data.valuationHigh < 0 || 
            data.valuationConfidence < 0 || data.valuationConfidence > 100) {
          return { 
            success: false, 
            error: {
              errors: [{ message: 'Valuation results validation failed', path: ['validation'] }]
            }
          };
        }
        return { success: true, data };
      })
    }
  };
});

// Create a global mock for Supabase
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
            limit: vi.fn(() => ({
              range: vi.fn(),
            })),
            range: vi.fn(),
          })),
          count: vi.fn(() => ({
            eq: vi.fn(() => ({
              head: vi.fn(),
            })),
          })),
          limit: vi.fn(),
        })),
        insert: vi.fn(),
        update: vi.fn(() => ({
          eq: vi.fn(),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
      functions: {
        invoke: vi.fn(),
      },
    },
  };
});

// Simplify Zod validation mocks to avoid complex error objects
vi.mock('@/utils/validationErrors', () => {
  return {
    createValidationErrorResponse: vi.fn().mockImplementation((error, customMessage) => {
      const message = customMessage || 'Validation error';
      return {
        success: false,
        error: message,
        data: null,
        metadata: {
          category: 'validation',
          validationErrors: [{ path: ['test'], message: 'Test error' }]
        }
      };
    }),
    formatZodError: vi.fn().mockReturnValue([{ path: ['test'], message: 'Test error' }]),
    getFieldErrors: vi.fn(),
    getFieldErrorMessage: vi.fn(),
    hasFieldError: vi.fn()
  };
}); 