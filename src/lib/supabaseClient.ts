
import { createClient } from '@supabase/supabase-js';

// Use import.meta.env to access Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if environment variables are available
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Create a dummy client if not configured
const createDummyClient = () => {
  console.warn(
    "Supabase is not configured. Please connect to Supabase using the Lovable integration."
  );
  
  // Return a mock client that doesn't throw errors but doesn't do anything
  return {
    auth: {
      signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
      onAuthStateChange: () => ({ data: null, subscription: { unsubscribe: () => {} } }),
    },
    // Add other mock methods as needed
  };
};

// Initialize the Supabase client or a dummy client
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient() as unknown as ReturnType<typeof createClient>;
