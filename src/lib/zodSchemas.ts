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
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (password) => {
        // Check for at least one uppercase letter, one lowercase, one number
        return (
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password)
        );
      },
      {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
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
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (password) => {
        // Check for at least one uppercase letter, one lowercase, one number
        return (
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password)
        );
      },
      {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
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