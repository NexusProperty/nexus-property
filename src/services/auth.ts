import { AuthError, Session, UserResponse, User, AuthResponse as SupabaseAuthResponse } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { loginSchema, registerSchema, resetPasswordSchema, updatePasswordSchema } from '@/lib/zodSchemas';
import { z } from 'zod';
import { refreshCsrfToken } from '@/lib/csrf';

export interface AuthResult<T = unknown> {
  success: boolean;
  error: string | null;
  data: T | null;
  validationErrors?: z.ZodIssue[];
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
    // Validate input using Zod schema
    const validationResult = loginSchema.safeParse({ email, password, rememberMe });
    
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        data: null,
        validationErrors: validationResult.error.issues,
      };
    }
    
    // Proceed with sign in if validation passes
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
      // Options are not needed for signInWithPassword
      // The session duration is managed by Supabase Auth settings
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
  confirmPassword: string,
  fullName: string,
  role: 'agent' | 'customer' | 'admin',
  metadata?: Record<string, unknown>
): Promise<AuthResult<SupabaseAuthResponse['data']>> {
  try {
    // Validate input using Zod schema
    const validationResult = registerSchema.safeParse({ 
      email, 
      password, 
      confirmPassword, 
      fullName, 
      role 
    });
    
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        data: null,
        validationErrors: validationResult.error.issues,
      };
    }
    
    // Include fullName in metadata
    const userMetadata = {
      full_name: fullName,
      role,
      ...metadata
    };
    
    // Proceed with sign up if validation passes
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata,
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
export async function resetPassword(email: string, redirectUrl?: string): Promise<AuthResult<null>> {
  try {
    // Validate input using Zod schema
    const validationResult = resetPasswordSchema.safeParse({ email });
    
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        data: null,
        validationErrors: validationResult.error.issues,
      };
    }
    
    // Validate redirect URL if provided
    let safeRedirectUrl = `${window.location.origin}/reset-password`;
    
    if (redirectUrl) {
      // Ensure URL is from the same origin for security
      try {
        const url = new URL(redirectUrl);
        if (url.origin === window.location.origin) {
          safeRedirectUrl = redirectUrl;
        } else {
          console.warn('Attempted redirect to external domain was blocked for security');
        }
      } catch (e) {
        console.warn('Invalid redirect URL format provided');
      }
    }
    
    // Proceed if validation passes
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: safeRedirectUrl,
    });

    if (error) throw error;

    return {
      success: true,
      error: null,
      data: null,
    };
  } catch (error) {
    // Use generic error message for security
    return {
      success: false,
      error: 'If your email exists in our system, you will receive a password reset link shortly.',
      data: null,
    };
  }
}

/**
 * Update the user's password (used after receiving reset email)
 */
export async function updatePassword(
  password: string, 
  confirmPassword: string
): Promise<AuthResult<null>> {
  try {
    // Validate input using Zod schema
    const validationResult = updatePasswordSchema.safeParse({ 
      password, 
      confirmPassword 
    });
    
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        data: null,
        validationErrors: validationResult.error.issues,
      };
    }
    
    // Proceed if validation passes
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

/**
 * Refresh the authentication token
 * This should be called periodically to ensure the session remains valid
 */
export async function refreshSession(): Promise<AuthResult<Session | null>> {
  try {
    // Attempt to refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) throw error;
    
    // If the session was refreshed successfully, also refresh the CSRF token
    if (data.session) {
      await refreshCsrfToken();
    }
    
    return {
      success: true,
      error: null,
      data: data.session,
    };
  } catch (error) {
    // Use a generic error message for security
    return {
      success: false,
      error: 'Failed to refresh authentication. Please sign in again.',
      data: null,
    };
  }
} 