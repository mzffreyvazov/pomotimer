import React, { useState } from "react";
import { Auth } from "@/components/Auth";
import PomodoroApp from "@/components/PomodoroApp";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<"signup" | "login" | null>(null);

  // Function to show the auth modal with the specified mode
  const showAuthModal = (mode: "signup" | "login") => {
    setAuthMode(mode);
  };
  return (
    <div>
      <PomodoroApp
        showSignupModal={() => showAuthModal("signup")}
        showLoginModal={() => showAuthModal("login")}
      />

      {/* Auth component renders modals that appear over the main app */}
      {authMode && (
        <Auth initialMode={authMode} onClose={() => setAuthMode(null)} />
      )}
    </div>
  );
};

export default Index;
