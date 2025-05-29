import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser, getUserSessions } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
        setIsLoading(false);
        if (session?.user) {
          // Pre-fetch user sessions in the background
          getUserSessions();
        }
      }
    );

    checkUser();

    // Cleanup subscription
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Get current URL info
      const currentOrigin = window.location.origin;
      const hostname = window.location.hostname;
      
      // More explicit localhost detection
      const isLocalhost = hostname === 'localhost' || 
                         hostname === '127.0.0.1' || 
                         hostname.startsWith('localhost:') ||
                         hostname.startsWith('127.0.0.1:');
      
      // Force localhost redirect in development - be more explicit
      let redirectTo;
      if (isLocalhost) {
        // Force the exact localhost URL, don't rely on window.location.origin
        redirectTo = `http://localhost:8080`;
      } else {
        redirectTo = currentOrigin;
      }

      console.log('=== AUTH DEBUG INFO ===');
      console.log('Current origin:', currentOrigin);
      console.log('Hostname:', hostname);
      console.log('Is localhost:', isLocalhost);
      console.log('Redirect URL being used:', redirectTo);
      console.log('========================');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo
        }
      });
      
      if (error) {
        console.error('Error signing in with Google:', error);
        throw error;
      }
    } catch (error) {
      console.error('Unexpected error during Google sign in:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
