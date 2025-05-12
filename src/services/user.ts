import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface UserResult<T = unknown> {
  success: boolean;
  error: string | null;
  data: T | null;
}

/**
 * Get the current user's profile
 */
export async function getProfile(userId: string): Promise<UserResult<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
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
 * Update the current user's profile
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<UserResult<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
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
 * Create a new user profile
 * This is typically called after user registration
 */
export async function createProfile(
  userId: string,
  profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
): Promise<UserResult<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          ...profile,
        },
      ])
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