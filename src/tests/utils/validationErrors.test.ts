import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Mock the fromZodError function
vi.mock('zod-validation-error', () => ({
  fromZodError: vi.fn().mockReturnValue({ message: 'Validation failed' })
}));

// Import the validation error utilities after setting up mocks
import { 
  formatZodError, 
  createValidationErrorResponse, 
  getFieldErrors, 
  getFieldErrorMessage, 
  hasFieldError 
} from '@/utils/validationErrors';
import { ServiceResponse } from '@/lib/service-helper';

describe('Validation Error Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Create a sample validation schema for testing
  const userSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email format'),
    age: z.number().min(18, 'Must be at least 18 years old')
  });

  // Create sample validation errors
  const createSampleError = () => {
    try {
      userSchema.parse({
        name: 'Jo',
        email: 'not-an-email',
        age: 16
      });
      return null;
    } catch (error) {
      return error as z.ZodError;
    }
  };

  describe('formatZodError', () => {
    it('should format a ZodError into an array of validation errors', () => {
      const error = createSampleError();
      expect(error).not.toBeNull();
      
      if (error) {
        // The actual error should have 3 issues (name, email, age)
        expect(error.errors.length).toBe(3);
        
        const formatted = formatZodError(error);
        expect(formatted).toBeInstanceOf(Array);
        
        // Check if the length matches the number of error issues
        expect(formatted.length).toBe(error.errors.length);
        
        // Verify path and message structure
        formatted.forEach(err => {
          expect(err).toHaveProperty('path');
          expect(err).toHaveProperty('message');
          expect(Array.isArray(err.path)).toBe(true);
        });
      }
    });
  });

  describe('createValidationErrorResponse', () => {
    it('should create a service error response with validation errors', () => {
      const error = createSampleError();
      expect(error).not.toBeNull();
      
      if (error) {
        const response = createValidationErrorResponse(error);
        
        // Check response structure
        expect(response.success).toBe(false);
        expect(response.error).toBeTruthy();
        expect(response.data).toBeNull();
        expect(response.metadata).toBeDefined();
        expect(response.metadata?.category).toBe('validation');
        expect(Array.isArray(response.metadata?.validationErrors)).toBe(true);
      }
    });

    it('should use custom message when provided', () => {
      const error = createSampleError();
      expect(error).not.toBeNull();
      
      if (error) {
        const customMessage = 'Custom validation error message';
        const response = createValidationErrorResponse(error, customMessage);
        
        expect(response.error).toBe(customMessage);
      }
    });
  });

  describe('getFieldErrors', () => {
    it('should extract error messages for a specific field', () => {
      const error = createSampleError();
      expect(error).not.toBeNull();
      
      if (error) {
        // Create a mock service response with validation errors
        const mockResponse: ServiceResponse<unknown> = {
          success: false,
          error: 'Validation failed',
          data: null,
          metadata: {
            category: 'validation',
            validationErrors: [
              { path: ['name'], message: 'Name must be at least 3 characters' },
              { path: ['email'], message: 'Invalid email format' },
              { path: ['age'], message: 'Must be at least 18 years old' }
            ]
          }
        };
        
        // Test with mock response instead of actual createValidationErrorResponse result
        const nameErrors = getFieldErrors(mockResponse, 'name');
        expect(nameErrors).toBeInstanceOf(Array);
        expect(nameErrors.length).toBe(1);
        expect(nameErrors[0]).toBe('Name must be at least 3 characters');
        
        // Check non-existent field
        const nonExistentErrors = getFieldErrors(mockResponse, 'nonexistent');
        expect(nonExistentErrors).toBeInstanceOf(Array);
        expect(nonExistentErrors.length).toBe(0);
      }
    });

    it('should handle responses without validation errors', () => {
      const response: ServiceResponse = {
        success: false,
        error: 'Some other error',
        data: null
      };
      
      const errors = getFieldErrors(response, 'name');
      expect(errors).toBeInstanceOf(Array);
      expect(errors.length).toBe(0);
    });
  });

  describe('getFieldErrorMessage', () => {
    it('should get the first error message for a field', () => {
      // Create a mock service response with validation errors
      const mockResponse: ServiceResponse<unknown> = {
        success: false,
        error: 'Validation failed',
        data: null,
        metadata: {
          category: 'validation',
          validationErrors: [
            { path: ['name'], message: 'Name must be at least 3 characters' },
            { path: ['email'], message: 'Invalid email format' },
            { path: ['age'], message: 'Must be at least 18 years old' }
          ]
        }
      };
      
      // Check first error message
      const nameErrorMessage = getFieldErrorMessage(mockResponse, 'name');
      expect(nameErrorMessage).toBe('Name must be at least 3 characters');
      
      // Check non-existent field
      const nonExistentErrorMessage = getFieldErrorMessage(mockResponse, 'nonexistent');
      expect(nonExistentErrorMessage).toBeNull();
    });
  });

  describe('hasFieldError', () => {
    it('should check if a field has validation errors', () => {
      // Create a mock service response with validation errors
      const mockResponse: ServiceResponse<unknown> = {
        success: false,
        error: 'Validation failed',
        data: null,
        metadata: {
          category: 'validation',
          validationErrors: [
            { path: ['name'], message: 'Name must be at least 3 characters' },
            { path: ['email'], message: 'Invalid email format' },
            { path: ['age'], message: 'Must be at least 18 years old' }
          ]
        }
      };
      
      // Check fields with errors
      expect(hasFieldError(mockResponse, 'name')).toBe(true);
      expect(hasFieldError(mockResponse, 'email')).toBe(true);
      expect(hasFieldError(mockResponse, 'age')).toBe(true);
      
      // Check non-existent field
      expect(hasFieldError(mockResponse, 'nonexistent')).toBe(false);
    });
  });
}); 