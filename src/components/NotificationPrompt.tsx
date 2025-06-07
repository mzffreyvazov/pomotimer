import React, { useState, useEffect } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';

export const NotificationPrompt: React.FC = () => {
  const { requestNotificationPermission, notificationPermission } = useTimer();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show the prompt only if permission is in the 'default' state.
    if (notificationPermission === 'default') {
      const timer = setTimeout(() => setShowPrompt(true), 1000); // Delay appearance slightly
      return () => clearTimeout(timer);
    } else {
      setShowPrompt(false);
    }
  }, [notificationPermission]);

  // Handler for the "Allow" button
  const handleAllow = () => {
    requestNotificationPermission();
    setShowPrompt(false);
  };

  // Handler for the "Not now" button
  const handleDeny = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    // Main container styled to look exactly like the target UI
    <div className="fixed bottom-5 right-5 z-50 flex max-w-sm animate-fade-in flex-col gap-3 rounded-2xl border border-pomo-muted/30 bg-pomo-background p-6 shadow-lg shadow-black/30">
      
      {/* Text Content */}
      <div>
        <h3 className="text-[13.5px] font-semibold text-pomo-foreground">
          Enable notifications?
        </h3>
        <p className="mt-1 text-xs font-medium text-pomo-secondary">
          Get notified when your timer completes while you're working.
        </p>
      </div>

      {/* Button Group - Left-aligned and side-by-side */}
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDeny}
          className="h-8 rounded-lg bg-pomo-muted/40 px-4 py-2 text-xs font-medium text-pomo-secondary transition-colors duration-300 hover:bg-pomo-muted/60"
        >
          Not now
        </Button>
        <Button 
          size="sm" 
          onClick={handleAllow}
          className="h-8 rounded-lg bg-pomo-primary/80 px-4 py-2 text-xs font-semibold text-pomo-background transition-colors duration-300 hover:bg-pomo-primary"
        >
          Allow
        </Button>
      </div>
    </div>
  );
};