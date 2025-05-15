
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured by detecting the dummy client
    const checkSupabaseConfig = async () => {
      try {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: 'test@example.com', 
          password: 'password' 
        });
        
        // If the error message matches our dummy client message
        if (error?.message === 'Supabase not configured') {
          setIsSupabaseConfigured(false);
          setError('Supabase is not configured. Please connect to Supabase using the Lovable integration.');
        }
      } catch (err) {
        // Catching any other errors means the client exists but may have other issues
        console.error("Error checking Supabase configuration:", err);
      }
    };
    
    checkSupabaseConfig();
  }, []);

  const handleSignUp = async () => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Please connect to Supabase using the Lovable integration.");
      return;
    }
    
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      console.log("Attempting to sign up with email:", email);
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        console.error("Sign up error:", error);
        setError(error.message);
      } else {
        console.log("Sign up successful:", data);
        setMessage("Sign up successful! Check your email for verification.");
      }
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Please connect to Supabase using the Lovable integration.");
      return;
    }
    
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      console.log("Attempting to sign in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Sign in error:", error);
        setError(error.message);
      } else {
        console.log("Sign in successful:", data);
      }
    } catch (err) {
      console.error("Unexpected error during signin:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xs mx-auto p-6 rounded-xl bg-pomo-background border border-pomo-muted/30 shadow mt-20">
      <h2 className="text-lg font-semibold mb-4">Sign In / Sign Up</h2>
      {!isSupabaseConfigured && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
          <AlertCircle className="text-yellow-500 mr-2 h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-700">
            Supabase is not configured. Please connect using the Supabase button at the top right.
          </div>
        </div>
      )}
      <div className="space-y-3">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={loading}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />
        <div className="flex gap-2">
          <Button onClick={handleSignIn} disabled={loading} className="flex-1">
            {loading ? "Loading..." : "Sign In"}
          </Button>
          <Button onClick={handleSignUp} disabled={loading} variant="outline" className="flex-1">
            {loading ? "Loading..." : "Sign Up"}
          </Button>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {message && <div className="text-green-500 text-sm">{message}</div>}
      </div>
    </div>
  );
}
