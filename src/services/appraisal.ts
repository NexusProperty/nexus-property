import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Appraisal = Database['public']['Tables']['appraisals']['Row'];
type AppraisalInsert = Database['public']['Tables']['appraisals']['Insert'];
type AppraisalUpdate = Database['public']['Tables']['appraisals']['Update'];
type ComparableProperty = Database['public']['Tables']['comparable_properties']['Row'];
type ComparablePropertyInsert = Database['public']['Tables']['comparable_properties']['Insert'];

export interface AppraisalResult<T = unknown> {
  success: boolean;
  error: string | null;
  data: T | null;
}

/**
 * Get an appraisal by ID
 */
export async function getAppraisal(id: string): Promise<AppraisalResult<Appraisal>> {
  try {
    const { data, error } = await supabase
      .from('appraisals')
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
 * Get appraisal with comparable properties
 */
export async function getAppraisalWithComparables(id: string): Promise<AppraisalResult<{
  appraisal: Appraisal;
  comparables: ComparableProperty[];
}>> {
  try {
    // Get the appraisal
    const { data: appraisal, error: appraisalError } = await supabase
      .from('appraisals')
      .select('*')
      .eq('id', id)
      .single();

    if (appraisalError) throw appraisalError;

    // Get the comparable properties
    const { data: comparables, error: comparablesError } = await supabase
      .from('comparable_properties')
      .select('*')
      .eq('appraisal_id', id)
      .order('similarity_score', { ascending: false });

    if (comparablesError) throw comparablesError;

    return {
      success: true,
      error: null,
      data: {
        appraisal,
        comparables: comparables || [],
      },
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
 * Get all appraisals for the current user
 */
export async function getUserAppraisals(userId: string): Promise<AppraisalResult<Appraisal[]>> {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .select('*')
      .eq('user_id', userId)
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
 * Create a new appraisal
 */
export async function createAppraisal(appraisal: AppraisalInsert): Promise<AppraisalResult<Appraisal>> {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .insert([appraisal])
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
 * Update an appraisal
 */
export async function updateAppraisal(
  id: string,
  updates: AppraisalUpdate
): Promise<AppraisalResult<Appraisal>> {
  try {
    const { data, error } = await supabase
      .from('appraisals')
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
 * Delete an appraisal
 */
export async function deleteAppraisal(id: string): Promise<AppraisalResult<null>> {
  try {
    const { error } = await supabase
      .from('appraisals')
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
 * Add comparable properties to an appraisal
 */
export async function addComparableProperties(
  comparables: ComparablePropertyInsert[]
): Promise<AppraisalResult<ComparableProperty[]>> {
  try {
    const { data, error } = await supabase
      .from('comparable_properties')
      .insert(comparables)
      .select();

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
 * Search appraisals
 */
export async function searchAppraisals(
  searchTerm: string,
  userId: string
): Promise<AppraisalResult<Appraisal[]>> {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .select('*')
      .eq('user_id', userId)
      .or(`property_address.ilike.%${searchTerm}%,property_suburb.ilike.%${searchTerm}%,property_city.ilike.%${searchTerm}%`)
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
 * Get the report URL for an appraisal
 */
export async function getAppraisalReport(appraisalId: string): Promise<AppraisalResult<string>> {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .select('report_url')
      .eq('id', appraisalId)
      .single();

    if (error) throw error;

    if (!data.report_url) {
      throw new Error('No report available for this appraisal');
    }

    // Create a signed URL for the report
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('reports')
      .createSignedUrl(data.report_url, 60); // 60 seconds expiry

    if (signedUrlError) throw signedUrlError;

    return {
      success: true,
      error: null,
      data: signedUrlData.signedUrl,
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