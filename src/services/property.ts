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