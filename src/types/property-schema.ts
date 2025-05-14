import { z } from 'zod';

/**
 * Schema for address validation
 */
export const addressSchema = z.object({
  address: z.string().min(3, 'Address must be at least 3 characters'),
  suburb: z.string().min(2, 'Suburb must be at least 2 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  postcode: z.string().optional().nullable(),
});

/**
 * Schema for basic property validation
 */
export const propertyBaseSchema = z.object({
  address: z.string().min(3, 'Address must be at least 3 characters'),
  suburb: z.string().min(2, 'Suburb must be at least 2 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  postcode: z.string().optional().nullable(),
  property_type: z.enum(['house', 'apartment', 'townhouse', 'land', 'commercial', 'other'], {
    errorMap: () => ({ message: 'Please select a valid property type' }),
  }),
  bedrooms: z.number().int().min(0, 'Number of bedrooms must be 0 or greater').optional().nullable(),
  bathrooms: z.number().min(0, 'Number of bathrooms must be 0 or greater').optional().nullable(),
  land_size: z.number().min(0, 'Land size must be 0 or greater').optional().nullable(),
  floor_area: z.number().min(0, 'Floor area must be 0 or greater').optional().nullable(),
  year_built: z.number().int().min(1800, 'Year built must be 1800 or later')
    .max(new Date().getFullYear(), 'Year built cannot be in the future')
    .optional()
    .nullable(),
  description: z.string().optional().nullable(),
});

/**
 * Schema for creating a new property
 */
export const createPropertySchema = propertyBaseSchema.extend({
  owner_id: z.string().uuid('Owner ID must be a valid UUID'),
  listing_type: z.enum(['sale', 'rent', 'not_listed'], {
    errorMap: () => ({ message: 'Please select a valid listing type' }),
  }).optional(),
  price: z.number().min(0, 'Price must be 0 or greater').optional().nullable(),
  status: z.enum(['active', 'pending', 'sold', 'rented', 'inactive'], {
    errorMap: () => ({ message: 'Please select a valid status' }),
  }).default('active'),
});

/**
 * Schema for updating an existing property
 */
export const updatePropertySchema = propertyBaseSchema
  .partial() // Makes all fields optional for updates
  .extend({
    // Add any fields that should be required for updates
    // or have different validation rules
  });

/**
 * Schema for searching properties by address
 */
export const propertySearchSchema = z.object({
  searchTerm: z.string().min(2, 'Search term must be at least 2 characters'),
  userId: z.string().uuid('User ID must be a valid UUID'),
}); 