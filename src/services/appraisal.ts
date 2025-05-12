import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Appraisal = Database['public']['Tables']['appraisals']['Row'];
type AppraisalInsert = Database['public']['Tables']['appraisals']['Insert'];
type AppraisalUpdate = Database['public']['Tables']['appraisals']['Update'];

export interface AppraisalResult<T = unknown> {
  success: boolean;
  error: string | null;
  data: T | null;
}

/**
 * Get a specific appraisal by ID for the authenticated user
 */
export async function getAppraisal(appraisalId: string): Promise<AppraisalResult<Appraisal>> {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .select('*')
      .eq('id', appraisalId)
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
 * Get all appraisals for the authenticated user
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
export async function createAppraisal(
  appraisal: Omit<AppraisalInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<AppraisalResult<Appraisal>> {
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
 * Update an existing appraisal
 */
export async function updateAppraisal(
  appraisalId: string,
  updates: AppraisalUpdate
): Promise<AppraisalResult<Appraisal>> {
  try {
    const { data, error } = await supabase
      .from('appraisals')
      .update(updates)
      .eq('id', appraisalId)
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