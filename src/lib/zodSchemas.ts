import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false),
});

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .refine(
      (password) => {
        // Check for at least one uppercase letter, one lowercase, one number, and one special character
        return (
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password) &&
          /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password)
        );
      },
      {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      }
    )
    .refine(
      (password) => {
        // Check that password doesn't contain common patterns
        const commonPatterns = [
          'password', '123456', 'qwerty', 'admin', 'welcome', 
          'letmein', 'monkey', 'abc123', 'football', 'iloveyou'
        ];
        return !commonPatterns.some(pattern => 
          password.toLowerCase().includes(pattern)
        );
      },
      {
        message: 'Password contains common patterns that are easily guessed',
      }
    ),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Please enter your full name'),
  role: z.enum(['agent', 'customer', 'admin'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .refine(
      (password) => {
        // Check for at least one uppercase letter, one lowercase, one number, and one special character
        return (
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password) &&
          /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password)
        );
      },
      {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      }
    )
    .refine(
      (password) => {
        // Check that password doesn't contain common patterns
        const commonPatterns = [
          'password', '123456', 'qwerty', 'admin', 'welcome', 
          'letmein', 'monkey', 'abc123', 'football', 'iloveyou'
        ];
        return !commonPatterns.some(pattern => 
          password.toLowerCase().includes(pattern)
        );
      },
      {
        message: 'Password contains common patterns that are easily guessed',
      }
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Profile schemas
export const userProfileSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Please enter a valid email address').optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9+\s()-]{7,15}$/.test(val),
      'Please enter a valid phone number'
    ),
  organization: z.string().optional(),
});

// Appraisal schemas
export const appraisalSchema = z.object({
  propertyAddress: z.string().min(5, 'Please enter a valid property address'),
  propertyType: z.enum(['house', 'apartment', 'townhouse', 'land', 'commercial', 'other'], {
    errorMap: () => ({ message: 'Please select a valid property type' }),
  }),
  bedrooms: z.number().int().min(0, 'Please enter a valid number').optional(),
  bathrooms: z.number().min(0, 'Please enter a valid number').optional(),
  landSize: z.number().min(0, 'Please enter a valid land size').optional(),
  buildYear: z.number().int().min(1800, 'Please enter a valid year').max(new Date().getFullYear(), 'Year cannot be in the future').optional(),
  notes: z.string().optional(),
});

// Property Valuation schemas
export const propertyDetailsSchema = z.object({
  address: z.string().min(5, 'Property address is required and must be at least 5 characters'),
  suburb: z.string().min(1, 'Property suburb is required'),
  city: z.string().min(1, 'Property city is required'),
  propertyType: z.string().min(1, 'Property type is required'),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  landSize: z.number().min(0).optional(),
  floorArea: z.number().min(0).optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
});

export const comparablePropertySchema = z.object({
  id: z.string().uuid('Invalid property ID format'),
  address: z.string().min(1, 'Address is required'),
  suburb: z.string().min(1, 'Suburb is required'),
  city: z.string().min(1, 'City is required'),
  propertyType: z.string().min(1, 'Property type is required'),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  landSize: z.number().min(0).optional(),
  floorArea: z.number().min(0).optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  saleDate: z.string().optional(),
  salePrice: z.number().min(0).optional(),
  similarityScore: z.number().min(0).max(100),
  distanceKm: z.number().min(0).optional(),
});

export const valuationRequestSchema = z.object({
  appraisalId: z.string().uuid('Invalid appraisal ID format'),
  propertyDetails: propertyDetailsSchema,
  comparableProperties: z.array(comparablePropertySchema)
    .min(3, 'At least 3 comparable properties are required for valuation')
});

export const valuationResultsSchema = z.object({
  valuationLow: z.number().min(0, 'Valuation low must be a positive number'),
  valuationHigh: z.number().min(0, 'Valuation high must be a positive number'),
  valuationConfidence: z.number().min(0).max(100, 'Confidence must be between 0 and 100'),
}); 