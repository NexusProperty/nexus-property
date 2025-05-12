import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

export interface PropertyResult<T = unknown> {
  success: boolean;
  error: string | null;
  data: T | null;
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
 * Get properties for the current user
 */
export async function getUserProperties(userId: string): Promise<PropertyResult<Property[]>> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

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
 * Create a new property
 */
export async function createProperty(property: PropertyInsert): Promise<PropertyResult<Property>> {
  try {
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
 * Search properties by address
 */
export async function searchProperties(
  searchTerm: string,
  userId: string
): Promise<PropertyResult<Property[]>> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', userId)
      .or(`address.ilike.%${searchTerm}%,suburb.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

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
  const errors: { field: string; message: string }[] = [];

  // Validate address line
  if (!address.address || address.address.trim().length < 3) {
    errors.push({
      field: 'address',
      message: 'Address must be at least 3 characters long',
    });
  }

  // Validate suburb
  if (!address.suburb || address.suburb.trim().length < 2) {
    errors.push({
      field: 'suburb',
      message: 'Suburb must be at least 2 characters long',
    });
  }

  // Validate city
  if (!address.city || address.city.trim().length < 2) {
    errors.push({
      field: 'city',
      message: 'City must be at least 2 characters long',
    });
  }

  // Validate postcode (if provided)
  if (address.postcode && !/^\d{4}$/.test(address.postcode)) {
    errors.push({
      field: 'postcode',
      message: 'Postcode must be a 4-digit number',
    });
  }

  // Normalize address if valid
  const normalizedAddress = errors.length === 0 ? normalizeAddress(address) : undefined;

  return {
    isValid: errors.length === 0,
    errors,
    normalizedAddress,
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
    // Using a join to get properties owned by members of the team
    const { data, error } = await supabase
      .rpc('get_team_properties', { team_id: teamId });
    
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