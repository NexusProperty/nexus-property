import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSession, getUser, onAuthStateChange } from '../services/auth';
import { getProfile } from '../services/user';
import { Database } from '../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get the initial session
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const currentSession = await getSession();
        if (currentSession) {
          setSession(currentSession);
          
          // Get the user data
          const { data } = await getUser();
          setUser(data.user);
          
          // Get the user profile
          if (data.user) {
            const profileResult = await getProfile(data.user.id);
            if (profileResult.success && profileResult.data) {
              setProfile(profileResult.data);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up the auth state change listener
    const { data: authListener } = onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      
      if (currentSession) {
        // Get user on auth state change
        const { data } = await getUser();
        setUser(data.user);
        
        // Get user profile
        if (data.user) {
          const profileResult = await getProfile(data.user.id);
          if (profileResult.success && profileResult.data) {
            setProfile(profileResult.data);
          }
        }
      } else {
        // Clear user and profile on sign out
        setUser(null);
        setProfile(null);
      }
    });

    // Clean up the auth listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 