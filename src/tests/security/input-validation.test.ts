import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Create a sample validation schema for property data
const propertySchema = z.object({
  address: z.string().min(5).max(200),
  propertyId: z.string().uuid().optional(),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().min(0).max(20),
  landSize: z.number().positive().optional(),
  price: z.number().positive().optional(),
  description: z.string().max(2000).optional()
});

// Create a sample validation schema for appraisal data
const appraisalSchema = z.object({
  propertyId: z.string().uuid(),
  customerId: z.string().uuid(),
  appraisalDate: z.string().datetime(),
  valuationEstimate: z.number().positive(),
  notes: z.string().max(2000).optional(),
  comparableProperties: z.array(z.string().uuid()).optional()
});

// Mock API validation function
const validateApiInput = <T>(data: unknown, schema: z.ZodSchema<T>): { 
  success: boolean; 
  data?: T; 
  error?: string;
  details?: z.ZodError 
} => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return formatted error details
      return { 
        success: false, 
        error: 'Validation failed', 
        details: error 
      };
    }
    return { success: false, error: 'Unknown error' };
  }
};

// Mock SQL injection detection function
const containsSqlInjection = (input: string): boolean => {
  const sqlInjectionPatterns = [
    /'\s*OR\s*'1'\s*=\s*'1/i,
    /'\s*OR\s*1\s*=\s*1/i,
    /'\s*;\s*DROP\s+TABLE/i,
    /'\s*;\s*DELETE\s+FROM/i,
    /'\s*UNION\s+SELECT/i,
    /'\s*;\s*INSERT\s+INTO/i,
    /'\s*;\s*UPDATE/i,
    /'\s*--/i
  ];
  
  return sqlInjectionPatterns.some(pattern => pattern.test(input));
};

describe('Input Validation Security Tests', () => {
  describe('Property Data Validation', () => {
    it('should validate valid property data', () => {
      const validPropertyData = {
        address: '123 Test Street, Auckland',
        bedrooms: 3,
        bathrooms: 2,
        landSize: 500,
        price: 750000,
        description: 'Beautiful family home in a quiet neighborhood'
      };
      
      const result = validateApiInput(validPropertyData, propertySchema);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should reject property data with invalid types', () => {
      const invalidPropertyData = {
        address: '123 Test Street, Auckland',
        bedrooms: '3', // Should be a number
        bathrooms: 2,
        landSize: 500,
        price: 750000
      };
      
      const result = validateApiInput(invalidPropertyData, propertySchema);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.details).toBeDefined();
      expect(result.details?.errors.some(e => e.path.includes('bedrooms'))).toBe(true);
    });

    it('should reject property data with out-of-range values', () => {
      const invalidPropertyData = {
        address: '123 Test Street, Auckland',
        bedrooms: 25, // Exceeds max of 20
        bathrooms: 2,
        landSize: 500,
        price: 750000
      };
      
      const result = validateApiInput(invalidPropertyData, propertySchema);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.details).toBeDefined();
      expect(result.details?.errors.some(e => e.path.includes('bedrooms'))).toBe(true);
    });

    it('should reject property data with missing required fields', () => {
      const incompletePropertyData = {
        // Missing required 'address' field
        bedrooms: 3,
        bathrooms: 2,
        landSize: 500,
        price: 750000
      };
      
      const result = validateApiInput(incompletePropertyData, propertySchema);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.details).toBeDefined();
      expect(result.details?.errors.some(e => e.path.includes('address'))).toBe(true);
    });
  });

  describe('Appraisal Data Validation', () => {
    it('should validate valid appraisal data', () => {
      const validAppraisalData = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        customerId: '123e4567-e89b-12d3-a456-426614174001',
        appraisalDate: '2023-05-15T14:30:00Z',
        valuationEstimate: 750000,
        notes: 'Property in excellent condition'
      };
      
      const result = validateApiInput(validAppraisalData, appraisalSchema);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should reject appraisal data with invalid UUID format', () => {
      const invalidAppraisalData = {
        propertyId: 'invalid-uuid', // Not a valid UUID
        customerId: '123e4567-e89b-12d3-a456-426614174001',
        appraisalDate: '2023-05-15T14:30:00Z',
        valuationEstimate: 750000
      };
      
      const result = validateApiInput(invalidAppraisalData, appraisalSchema);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.details).toBeDefined();
      expect(result.details?.errors.some(e => e.path.includes('propertyId'))).toBe(true);
    });

    it('should reject appraisal data with invalid date format', () => {
      const invalidAppraisalData = {
        propertyId: '123e4567-e89b-12d3-a456-426614174000',
        customerId: '123e4567-e89b-12d3-a456-426614174001',
        appraisalDate: 'not-a-date', // Invalid date format
        valuationEstimate: 750000
      };
      
      const result = validateApiInput(invalidAppraisalData, appraisalSchema);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.details).toBeDefined();
      expect(result.details?.errors.some(e => e.path.includes('appraisalDate'))).toBe(true);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should detect basic SQL injection attempts', () => {
      const maliciousInputs = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users; --",
        "' OR 1=1 --",
        "admin'; INSERT INTO users VALUES ('hacker', 'password'); --"
      ];
      
      maliciousInputs.forEach(input => {
        expect(containsSqlInjection(input)).toBe(true);
      });
    });

    it('should not flag legitimate text as SQL injection', () => {
      const legitimateInputs = [
        "123 Main Street, Auckland",
        "O'Reilly's Property",
        "Notes about the property's condition",
        "Property with -- markings on the wall",
        "Customer's feedback: excellent service!"
      ];
      
      legitimateInputs.forEach(input => {
        expect(containsSqlInjection(input)).toBe(false);
      });
    });

    it('should validate user input before database operations', () => {
      // Sample function that would execute a database query
      const executeQuery = (input: string): { success: boolean; error?: string } => {
        // Check for SQL injection before executing
        if (containsSqlInjection(input)) {
          return { success: false, error: 'Potential SQL injection detected' };
        }
        
        // If no injection detected, query would be executed
        return { success: true };
      };
      
      // Test with malicious input
      const result = executeQuery("' OR '1'='1");
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Potential SQL injection detected');
      
      // Test with legitimate input
      const validResult = executeQuery("123 Main Street, Auckland");
      
      expect(validResult.success).toBe(true);
      expect(validResult.error).toBeUndefined();
    });
  });

  describe('Cross-Site Scripting (XSS) Prevention', () => {
    // Mock HTML sanitization function
    const sanitizeHtml = (input: string): string => {
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/`/g, '&#96;');
    };
    
    it('should sanitize HTML in user input', () => {
      const maliciousInputs = [
        "<script>alert('XSS')</script>",
        "<img src='x' onerror='alert(\"XSS\")'>",
        "<a href='javascript:alert(\"XSS\")'>Click me</a>",
        "<div onmouseover='alert(\"XSS\")'>Hover over me</div>"
      ];
      
      maliciousInputs.forEach(input => {
        const sanitized = sanitizeHtml(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onmouseover=');
      });
    });

    it('should preserve legitimate text content after sanitization', () => {
      const legitInput = "This is a normal description with some special characters: $, %, &, @";
      const sanitized = sanitizeHtml(legitInput);
      
      expect(sanitized).toBe(legitInput);
    });
  });
}); 