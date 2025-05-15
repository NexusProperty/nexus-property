import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSession, getUser, onAuthStateChange, signOut } from '@/services/auth';
import { getProfile } from '@/services/user';
import { Database } from '@/types/supabase';
import { initializeSessionHandler, stopTokenRefreshInterval, manualTokenRefresh } from '@/lib/session-handler';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  isLoadingProfile: boolean;
  isAuthenticated: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  refreshAuthToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticating: false,
  isLoadingProfile: false,
  isAuthenticated: false,
  error: null,
  refreshProfile: async () => {},
  refreshAuthToken: async () => false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const lastActivityTimestamp = useRef<number>(Date.now());

  /**
   * Fetch user profile from the database
   */
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      setIsLoadingProfile(true);
      setError(null);
      
      const profileResult = await getProfile(userId);
      
      if (!profileResult.success) {
        throw new Error(profileResult.error || 'Failed to fetch user profile');
      }
      
      if (profileResult.data) {
        setProfile(profileResult.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching user profile:', errorMessage);
      setError(`Profile error: ${errorMessage}`);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  /**
   * Allow manually refreshing the profile when needed
   */
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  }, [user?.id, fetchUserProfile]);

  /**
   * Handle auth state changes
   */
  const handleAuthChange = useCallback(async (currentSession: Session | null) => {
    try {
      setSession(currentSession);
      
      if (currentSession) {
        // Get user data
        const { data } = await getUser();
        setUser(data.user);
        
        // Get user profile
        if (data.user) {
          await fetchUserProfile(data.user.id);
        }
      } else {
        // Clear user and profile on sign out
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error handling auth change:', errorMessage);
      setError(`Authentication error: ${errorMessage}`);
    }
  }, [fetchUserProfile]);

  /**
   * Force refresh the auth token
   * This can be used after a period of inactivity
   */
  const refreshAuthToken = useCallback(async () => {
    const success = await manualTokenRefresh();
    
    if (success) {
      // Get updated session and user data
      const sessionResult = await getSession();
      if (sessionResult.success && sessionResult.data) {
        await handleAuthChange(sessionResult.data);
      }
    }
    
    return success;
  }, [handleAuthChange]);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsAuthenticating(true);
        setError(null);
        
        // Initialize the session handler
        await initializeSessionHandler();
        
        const sessionResult = await getSession();
        if (sessionResult.success && sessionResult.data) {
          await handleAuthChange(sessionResult.data);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error('Error initializing auth:', errorMessage);
        setError(`Authentication error: ${errorMessage}`);
      } finally {
        setIsAuthenticating(false);
      }
    };

    initializeAuth();

    // Set up the auth state change listener
    const { data: authListener } = onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_OUT') {
        // Stop token refresh on sign out
        stopTokenRefreshInterval();
      }
      
      await handleAuthChange(currentSession);
    });

    // Clean up the auth listener
    return () => {
      authListener.subscription.unsubscribe();
      stopTokenRefreshInterval();
    };
  }, [handleAuthChange]);

  // Handle user activity to track inactivity
  const handleUserActivity = useCallback(() => {
    // Reset the inactivity timer
    lastActivityTimestamp.current = Date.now();
  }, []);

  // Handle user inactivity
  useEffect(() => {
    // Set up activity listeners
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    
    // Set up inactivity check (every minute)
    const inactivityCheckInterval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityTimestamp.current;
      
      // If inactive for more than 10 minutes and authenticated, refresh token
      if (inactiveTime > 10 * 60 * 1000 && session) {
        refreshAuthToken();
      }
    }, 60 * 1000);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      clearInterval(inactivityCheckInterval);
    };
  }, [session, refreshAuthToken, handleUserActivity]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    session,
    user,
    profile,
    isLoading: isAuthenticating || isLoadingProfile,
    isAuthenticating,
    isLoadingProfile,
    isAuthenticated: !!session,
    error,
    refreshProfile,
    refreshAuthToken,
  }), [
    session,
    user, 
    profile, 
    isAuthenticating, 
    isLoadingProfile,
    error,
    refreshProfile,
    refreshAuthToken
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 