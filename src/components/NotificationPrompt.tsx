import React, { useState, useEffect } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

export const NotificationPrompt: React.FC = () => {
  const { requestNotificationPermission, notificationPermission } = useTimer();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show prompt if permission is not granted or denied
    if (notificationPermission === 'default') {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, [notificationPermission]);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-pomo-muted/90 backdrop-blur-sm border border-pomo-muted/50 rounded-lg shadow-lg max-w-xs animate-fade-in z-50">
      <div className="flex items-start gap-3">
        <Bell className="text-pomo-primary mt-1" size={18} />
        <div>
          <h3 className="font-medium text-sm mb-1">Enable notifications?</h3>
          <p className="text-xs text-pomo-secondary mb-3">
            Get notified when your timer completes while you're on another tab.
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => requestNotificationPermission().then(() => setShowPrompt(false))}
              className="text-xs h-8"
            >
              Allow
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowPrompt(false)}
              className="text-xs h-8"
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
