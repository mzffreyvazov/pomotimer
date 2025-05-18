import React, { useState } from "react";
import { Auth } from "@/components/Auth";
import PomodoroApp from "@/components/PomodoroApp";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [showAuth, setShowAuth] = useState(false);
  if (showAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Auth />
      </div>
    );
  }

  return (
    <div>
      <PomodoroApp showAuthModal={() => setShowAuth(true)} />
    </div>
  );
};

export default Index;
