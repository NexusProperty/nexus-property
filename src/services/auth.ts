import { AuthError, Session, UserResponse, User, AuthResponse as SupabaseAuthResponse } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthResult<T = unknown> {
  success: boolean;
  error: string | null;
  data: T | null;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<AuthResult<SupabaseAuthResponse['data']>> {
  try {
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // Set session duration based on rememberMe preference
        // By default, sessions last for a short period, but we can extend it if rememberMe is true
        expiresIn: rememberMe ? 60 * 60 * 24 * 30 : undefined, // 30 days if remember me, otherwise default
      }
    });

    if (response.error) throw response.error;

    return {
      success: true,
      error: null,
      data: response.data,
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError.message,
      data: null,
    };
  }
}

/**
 * Sign up with email, password and other user data
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: Record<string, unknown>
): Promise<AuthResult<SupabaseAuthResponse['data']>> {
  try {
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (response.error) throw response.error;

    return {
      success: true,
      error: null,
      data: response.data,
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError.message,
      data: null,
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult<null>> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return {
      success: true,
      error: null,
      data: null,
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError.message,
      data: null,
    };
  }
}

/**
 * Request a password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult<null>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    return {
      success: true,
      error: null,
      data: null,
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError.message,
      data: null,
    };
  }
}

/**
 * Update the user's password (used after receiving reset email)
 */
export async function updatePassword(password: string): Promise<AuthResult<null>> {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;

    return {
      success: true,
      error: null,
      data: null,
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: authError.message,
      data: null,
    };
  }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Get the current user
 */
export async function getUser(): Promise<{ data: { user: User | null } }> {
  const { data } = await supabase.auth.getUser();
  return { data };
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
} 