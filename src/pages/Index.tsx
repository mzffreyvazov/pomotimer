import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Auth } from "@/components/Auth";
import PomodoroApp from "@/components/PomodoroApp";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Index component mounted, checking auth state...");
    
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Auth session error:", error);
          setError(error.message);
        } else {
          console.log("Session data:", data.session ? "User logged in" : "No session");
          setUser(data.session?.user ?? null);
        }
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error checking session:", err);
        setError("Failed to check authentication status");
        setLoading(false);
      }
    };
    
    checkSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session ? "User present" : "No user");
      setUser(session?.user ?? null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">
          <h3 className="text-lg font-bold">Something went wrong</h3>
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-pomo-primary rounded text-white"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show auth or app
  return user ? (
    <div>
      <div className="fixed top-0 right-0 m-4 z-10">
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-3 py-1 text-sm bg-pomo-muted hover:bg-pomo-muted/70 rounded-md"
        >
          Sign out
        </button>
      </div>
      <PomodoroApp />
    </div>
  ) : (
    <Auth />
  );
};

export default Index;
