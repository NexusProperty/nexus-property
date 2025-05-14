import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { 
  createPropertySchema, 
  updatePropertySchema, 
  propertySearchSchema,
  addressSchema 
} from '@/types/property-schema';
import { z } from 'zod';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

export interface PropertyResult<T = unknown> {
  success: boolean;
  error: string | null;
  data: T | null;
  validationErrors?: z.ZodIssue[];
  pagination?: PaginationMetadata;
}

export interface PaginationMetadata {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Address {
  address: string;
  suburb: string;
  city: string;
  postcode?: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  normalizedAddress?: Address;
}

/**
 * Get a property by its ID
 */
export async function getProperty(id: string): Promise<PropertyResult<Property>> {
  try {
    // Validate id format
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Invalid property ID',
        data: null,
      };
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message,
      data: null,
    };
  }
}

/**
 * Get properties for the current user with pagination support
 */
export async function getUserProperties(
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<PropertyResult<Property[]>> {
  try {
    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      return {
        success: false,
        error: 'Invalid user ID',
        data: null,
      };
    }

    // Validate pagination parameters
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 10;
    if (pageSize > 100) pageSize = 100; // Limit max page size

    // Calculate range values for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get total count for pagination metadata
    const countQuery = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId);

    if (countQuery.error) throw countQuery.error;
    
    const totalCount = countQuery.count || 0;
    
    // Get paginated data
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', userId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (error) throw error;

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);
    
    const paginationMetadata: PaginationMetadata = {
      currentPage: page,
      pageSize,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };

    return {
      success: true,
      error: null,
      data,
      pagination: paginationMetadata
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message,
      data: null,
    };
  }
}

/**
 * Create a new property
 */
export async function createProperty(property: PropertyInsert): Promise<PropertyResult<Property>> {
  try {
    // Validate input using Zod schema
    const validationResult = createPropertySchema.safeParse(property);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        data: null,
        validationErrors: validationResult.error.issues,
      };
    }
    
    // Proceed with creation if validation passes
    const { data, error } = await supabase
      .from('properties')
      .insert([property])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message,
      data: null,
    };
  }
}

/**
 * Update a property
 */
export async function updateProperty(
  id: string,
  updates: PropertyUpdate
): Promise<PropertyResult<Property>> {
  try {
    // Validate id format
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Invalid property ID',
        data: null,
      };
    }
    
    // Validate updates using Zod schema
    const validationResult = updatePropertySchema.safeParse(updates);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        data: null,
        validationErrors: validationResult.error.issues,
      };
    }
    
    // Proceed with update if validation passes
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message,
      data: null,
    };
  }
}

/**
 * Delete a property
 */
export async function deleteProperty(id: string): Promise<PropertyResult<null>> {
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return {
      success: true,
      error: null,
      data: null,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message,
      data: null,
    };
  }
}

/**
 * Search properties by address with pagination support
 */
export async function searchProperties(
  searchTerm: string,
  userId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PropertyResult<Property[]>> {
  try {
    // Validate input using Zod schema
    const validationResult = propertySearchSchema.safeParse({ searchTerm, userId });
    
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        data: null,
        validationErrors: validationResult.error.issues,
      };
    }

    // Validate pagination parameters
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 10;
    if (pageSize > 100) pageSize = 100; // Limit max page size

    // Calculate range values for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get total count for pagination metadata
    const countQuery = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .or(`address.ilike.%${searchTerm}%,suburb.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);

    if (countQuery.error) throw countQuery.error;
    
    const totalCount = countQuery.count || 0;

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', userId)
      .or(`address.ilike.%${searchTerm}%,suburb.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);
    
    const paginationMetadata: PaginationMetadata = {
      currentPage: page,
      pageSize,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };

    return {
      success: true,
      error: null,
      data,
      pagination: paginationMetadata
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message,
      data: null,
    };
  }
}

/**
 * Upload property image
 */
export async function uploadPropertyImage(
  propertyId: string,
  file: File
): Promise<PropertyResult<{ path: string }>> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${propertyId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);

    return {
      success: true,
      error: null,
      data: { path: data.publicUrl },
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message,
      data: null,
    };
  }
}

/**
 * Validate property address
 * This function performs basic validation to ensure address fields are properly formatted.
 * In a real-world scenario, this would connect to an external address verification API.
 */
export function validateAddress(address: Address): ValidationResult {
  // Validate using Zod schema
  const validationResult = addressSchema.safeParse(address);
  
  if (!validationResult.success) {
    // Convert Zod validation errors to our error format
    const errors = validationResult.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    
    return {
      isValid: false,
      errors,
    };
  }
  
  // If valid, return normalized address
  return {
    isValid: true,
    errors: [],
    normalizedAddress: normalizeAddress(address),
  };
}

/**
 * Normalize a property address
 * This function formats address components according to NZ standards.
 * In a real-world scenario, this would be more sophisticated and potentially
 * use an external service for address standardization.
 */
export function normalizeAddress(address: Address): Address {
  return {
    // Capitalize first letter of each word in the address
    address: address.address
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' '),
    
    // Capitalize suburb
    suburb: address.suburb.charAt(0).toUpperCase() + address.suburb.slice(1).toLowerCase(),
    
    // Capitalize city
    city: address.city.charAt(0).toUpperCase() + address.city.slice(1).toLowerCase(),
    
    // Keep postcode as is
    postcode: address.postcode,
  };
}

/**
 * Get similar properties
 * Finds properties with similar characteristics in the same area
 */
export async function getSimilarProperties(
  propertyId: string,
  limit: number = 3
): Promise<PropertyResult<Property[]>> {
  try {
    // First get the property details to match against
    const propertyResult = await getProperty(propertyId);
    
    if (!propertyResult.success || !propertyResult.data) {
      throw new Error(propertyResult.error || 'Failed to fetch property details');
    }
    
    const property = propertyResult.data;
    
    // Find similar properties in the same suburb with the same property type
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('suburb', property.suburb)
      .eq('property_type', property.property_type)
      .neq('id', propertyId) // Exclude the current property
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return {
      success: true,
      error: null,
      data,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message,
      data: null,
    };
  }
}

/**
 * Get properties by team
 */
export async function getTeamProperties(teamId: string): Promise<PropertyResult<Property[]>> {
  try {
    // Using a database function to get properties owned by members of the team
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .filter('team_id', 'eq', teamId);
    
    if (error) throw error;
    
    return {
      success: true,
      error: null,
      data: data as Property[],
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message,
      data: null,
    };
  }
} 