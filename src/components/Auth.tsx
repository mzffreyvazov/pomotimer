import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export function Auth() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("login");

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
        setMessage("Sign in successful!");
      }
    } catch (err) {
      console.error("Unexpected error during signin:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };
  // Google Sign-In functionality temporarily disabled
  const handleGoogleSignIn = async () => {
    setError("Google Sign-In is currently unavailable");
  };

  // Handle user logged in state
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto p-6 rounded-xl bg-pomo-background border border-pomo-muted/30 shadow mt-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pomo-primary" />
      </div>
    );
  }
  // If user is signed in, show an empty state or redirect
  // Now that account management is handled by the dropdown menu
  if (user) {
    return (
      <div className="max-w-md mx-auto p-6 rounded-xl bg-pomo-background border border-pomo-muted/30 shadow mt-10">
        <h2 className="text-xl font-semibold mb-4 text-center">Account</h2>
        <p className="text-center text-pomo-secondary mb-6">
          You are signed in as <span className="font-medium text-pomo-foreground">{user.email}</span>
        </p>
        <div className="flex justify-center">
          <Button onClick={signOut} variant="outline" className="w-full max-w-xs">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 rounded-xl bg-pomo-background border border-pomo-muted/30 shadow mt-10">
      <h2 className="text-xl font-semibold mb-6 text-center">Create Account</h2>
        {/* Google Sign-In button temporarily disabled */}
      <Button 
        onClick={handleGoogleSignIn} 
        disabled={true}
        variant="outline" 
        className="flex w-full items-center justify-center gap-2 mb-6 py-5 opacity-50 cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        <span>Continue with Google (Coming Soon)</span>
      </Button>
      
      <div className="relative my-6">
        <Separator className="absolute inset-0" />
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-pomo-background px-2 text-pomo-secondary">Sign in with email</span>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login" className="space-y-4">
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              className="py-5"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              className="py-5"
            />
            <Button 
              onClick={handleSignIn} 
              disabled={loading} 
              className="w-full py-5"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="signup" className="space-y-4">
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              className="py-5"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              className="py-5"
            />
            <Button 
              onClick={handleSignUp} 
              disabled={loading} 
              className="w-full py-5"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">{error}</div>}
      {message && <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-md">{message}</div>}
      
      <p className="text-xs text-pomo-secondary text-center pt-6">
        Sign in to save your sessions and access them from any device.
      </p>
    </div>
  );
}