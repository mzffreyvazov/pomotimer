import React, { useState } from "react";
import { Auth } from "@/components/Auth";
import PomodoroApp from "@/components/PomodoroApp";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return (
      <div className="relative">
        <Button 
          variant="ghost" 
          className="absolute top-4 left-4 z-10"
          onClick={() => setShowAuth(false)}
        >
          ← Back to App
        </Button>
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
