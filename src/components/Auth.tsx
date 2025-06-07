import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface AuthProps {
  initialMode?: 'signup' | 'login';
  onClose?: () => void;
}

export function Auth({ initialMode = 'signup', onClose }: AuthProps) {
  const { user, isLoading: authLoading, signOut, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(initialMode === 'login');
  const [signupModalOpen, setSignupModalOpen] = useState(initialMode === 'signup');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Close all modals when user logs in
  useEffect(() => {
    if (user) {
      setLoginModalOpen(false);
      setSignupModalOpen(false);
    }
  }, [user]);

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
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
        // Don't close the modal yet to show the success message
      }
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError("Email and password are required");
      return;
    }
    
    try {
      setLoginLoading(true);
      setLoginError(null);
      
      console.log("Attempting to sign in with email:", loginEmail);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: loginEmail, 
        password: loginPassword 
      });
      
      if (error) {
        console.error("Sign in error:", error);
        setLoginError(error.message);
      } else {
        console.log("Sign in successful:", data);
        setLoginModalOpen(false);
      }
    } catch (err) {
      console.error("Unexpected error during signin:", err);
      setLoginError("An unexpected error occurred");
    } finally {
      setLoginLoading(false);
    }
  };
  
  // Handle Google Sign-Up
  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      // Use signInWithGoogle from AuthContext for sign up
      await signInWithGoogle();
    } catch (err) {
      console.error("Unexpected error during Google sign up:", err);
      setError("An unexpected error occurred during Google sign up");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setLoginLoading(true);
      setLoginError(null);
      
      // Use signInWithGoogle from AuthContext for login
      await signInWithGoogle();
    } catch (err) {
      console.error("Unexpected error during Google sign in:", err);
      setLoginError("An unexpected error occurred during Google sign in");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle user logged in state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pomo-primary" />
      </div>
    );
  }

  // If user is signed in, show an empty state or redirect
  if (user) {
    return (
      <div className="flex justify-center">
        <div className="max-w-md w-full p-6 rounded-xl bg-pomo-background border border-pomo-muted/30 shadow">
          <h2 className="text-xl font-semibold mb-4 text-center">Account</h2>
          <p className="text-center text-pomo-secondary mb-6">
            You are signed in as{" "}
            <span className="font-medium text-pomo-foreground">
              {user.email || user.user_metadata?.full_name || "User"}
            </span>
          </p>
          <div className="flex justify-center">
            <Button onClick={signOut} variant="outline" className="w-full max-w-xs">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleCloseAllModals = () => {
    setSignupModalOpen(false);
    setLoginModalOpen(false);
    if (onClose) onClose();
  };

  const switchToLogin = () => {
    setSignupModalOpen(false);
    setLoginModalOpen(true);
  };

  const switchToSignup = () => {
    setLoginModalOpen(false);
    setSignupModalOpen(true);
  };

  return (
    <>
      {/* Sign Up Dialog */}
      <Dialog open={signupModalOpen} onOpenChange={(open) => {
        setSignupModalOpen(open);
        if (!open && onClose) onClose();
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-pomo-muted/30 bg-pomo-background shadow-lg shadow-black/30 p-6 w-[90vw] max-h-[80vh] overflow-y-auto md:w-full md:max-h-full md:overflow-y-visible">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">Create Account</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Google Sign-Up button */}
            <Button 
              onClick={handleGoogleSignUp} 
              disabled={loading}
              variant="outline" 
              className="flex w-full items-center justify-center gap-2 mb-4 py-5 border border-pomo-muted/50 bg-pomo-muted/30 hover:bg-pomo-muted/40 transition-colors rounded-xl shadow-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span>{loading ? "Signing up..." : "Continue with Google"}</span>
            </Button>
            
            <div className="relative my-4 flex items-center">
              <div className="flex-grow">
                <hr className="border-t border-pomo-muted/200 w-full" />
              </div>
              <div className="mx-4 text-xs uppercase text-pomo-secondary">
                Or
              </div>
              <div className="flex-grow">
                <hr className="border-t border-pomo-muted/200 w-full" />
              </div>
            </div>            {/* Sign Up Form */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="signup-email" className="text-sm font-medium leading-none text-pomo-secondary">
                  Email
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  className="py-5"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="signup-password" className="text-sm font-medium leading-none text-pomo-secondary">
                  Password
                </label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder=""
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  className="py-5"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="signup-confirm-password" className="text-sm font-medium leading-none text-pomo-secondary">
                  Confirm Password
                </label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  placeholder=""
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="py-5"
                />
              </div>
              <Button 
                onClick={handleSignUp} 
                disabled={loading} 
                className="w-full py-5 rounded-xl bg-pomo-primary/80 hover:bg-pomo-primary text-pomo-background shadow-md transition-colors font-semibold text-base tracking-tight" 
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.10)' }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </div>
            
            {error && <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg shadow-sm">{error}</div>}
            {message && <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-700 text-sm rounded-lg shadow-sm">{message}</div>}
            
            <div className="text-center pt-2">
              <button 
                onClick={switchToLogin}
                className="text-sm text-pomo-secondary hover:text-pomo-primary hover:underline transition-colors"
              >
                Already have an account? Log in
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Dialog */}
      <Dialog open={loginModalOpen} onOpenChange={(open) => {
        setLoginModalOpen(open);
        if (!open && onClose) onClose();
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-pomo-muted/30 bg-pomo-background shadow-lg shadow-black/30 p-6 w-[90vw] max-h-[80vh] overflow-y-auto md:w-full md:max-h-full md:overflow-y-visible">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">Welcome Back</DialogTitle>
            <DialogDescription className="text-center text-pomo-secondary">
              Log in to your account to continue
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Google Sign-In button */}
            <Button 
              onClick={handleGoogleSignIn} 
              disabled={loginLoading}
              variant="outline" 
              className="flex w-full items-center justify-center gap-2 mb-4 py-5 border border-pomo-muted/50 bg-pomo-muted/30 hover:bg-pomo-muted/40 transition-colors rounded-xl shadow-sm"
            >
              {loginLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span>{loginLoading ? "Logging in..." : "Continue with Google"}</span>
            </Button>
            
            <div className="relative my-4 flex items-center">
              <div className="flex-grow">
                <hr className="border-t border-pomo-muted/200 w-full" />
              </div>
              <div className="mx-4 text-xs uppercase text-pomo-secondary">
                Or
              </div>
              <div className="flex-grow">
                <hr className="border-t border-pomo-muted/200 w-full" />
              </div>
            </div>
              {/* Login Form */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium leading-none text-pomo-secondary">
                  Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="example@mail.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  disabled={loginLoading}
                  className="py-5"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium leading-none text-pomo-secondary">
                  Password
                </label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder=""
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  disabled={loginLoading}
                  className="py-5"
                />
              </div>
              <Button 
                onClick={handleSignIn} 
                disabled={loginLoading} 
                className="w-full py-5 rounded-xl bg-pomo-primary/80 hover:bg-pomo-primary text-pomo-background shadow-md transition-colors font-semibold text-base tracking-tight" 
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.10)' }}
              >
                {loginLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {loginLoading ? "Logging in..." : "Log In"}
              </Button>
            </div>
            
            {loginError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg shadow-sm">
                {loginError}
              </div>
            )}
            
            <div className="text-center pt-2">
              <button 
                onClick={switchToSignup}
                className="text-sm text-pomo-secondary hover:text-pomo-primary hover:underline transition-colors"
              >
                Don't have an account? Sign Up
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Authentication trigger buttons - only shown if no dialogs are open */}
      {!loginModalOpen && !signupModalOpen && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => setSignupModalOpen(true)} 
            className="w-full sm:w-auto"
          >
            Sign Up
          </Button>
          <Button 
            onClick={() => setLoginModalOpen(true)} 
            variant="outline" 
            className="w-full sm:w-auto"
          >
            Log In
          </Button>
        </div>
      )}
    </>
  );
}