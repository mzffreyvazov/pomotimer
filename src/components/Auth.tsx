import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignUp = async () => {
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