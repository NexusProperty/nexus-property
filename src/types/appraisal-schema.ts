import { z } from "zod";

// Property type validation
export const validPropertyTypes = ['house', 'apartment', 'townhouse', 'land', 'commercial', 'other'] as const;
export type PropertyType = typeof validPropertyTypes[number];

// Analysis depth options
export const validAnalysisDepths = ["basic", "standard", "detailed"] as const;
export type AnalysisDepth = typeof validAnalysisDepths[number];

// Define the appraisal form schema
export const appraisalFormSchema = z.object({
  // Step 1: Property Details
  property_id: z.string().optional().nullable(),
  property_address: z.string().min(3, 'Address must be at least 3 characters'),
  property_suburb: z.string().min(2, 'Suburb must be at least 2 characters'),
  property_city: z.string().min(2, 'City must be at least 2 characters'),
  property_postcode: z.string().optional().nullable(),
  property_type: z.enum(validPropertyTypes),
  
  // Step 2: Property Features
  bedrooms: z.number().min(0).optional().nullable(),
  bathrooms: z.number().min(0).optional().nullable(),
  land_size: z.number().min(0).optional().nullable(),
  floor_area: z.number().min(0).optional().nullable(),
  year_built: z.number().min(1800).max(new Date().getFullYear()).optional().nullable(),
  features: z.array(z.string()).optional().nullable(),
  
  // Step 3: Appraisal Parameters
  comparable_radius: z.number().min(1).max(20).default(5),
  include_recent_sales: z.boolean().default(true),
  recent_sales_months: z.number().min(1).max(36).default(12),
  market_analysis_depth: z.enum(validAnalysisDepths).default("standard"),
  is_public: z.boolean().default(false),
});

export type AppraisalFormValues = z.infer<typeof appraisalFormSchema>;

// Default values for the form
export const defaultAppraisalFormValues: Partial<AppraisalFormValues> = {
  property_address: '',
  property_suburb: '',
  property_city: '',
  property_postcode: '',
  property_type: 'house',
  bedrooms: null,
  bathrooms: null,
  land_size: null,
  floor_area: null,
  year_built: null,
  features: [],
  comparable_radius: 5,
  include_recent_sales: true,
  recent_sales_months: 12,
  market_analysis_depth: 'standard',
  is_public: false,
}; 