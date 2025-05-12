import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/sonner";
import { useIsMobileScreen } from './use-is-mobile-screen';
import { useTimer } from '@/contexts/TimerContext';

export function useSpacebarTip() {
  const [hasShownTip, setHasShownTip] = useState<boolean>(false);
  const isMobile = useIsMobileScreen();
  const { notificationPermission } = useTimer();

  useEffect(() => {
    // Only show the tip when:
    // 1. We haven't shown it yet
    // 2. Not on mobile devices
    // 3. User has already responded to the notification permission prompt (either granted or denied)
    if (!hasShownTip && !isMobile && notificationPermission !== 'default') {
      // Use a small delay so the tip appears after the notification prompt has been dealt with
      const timer = setTimeout(() => {
        toast("Keyboard shortcuts available", {
          description: [
            "Press Spacebar to start/pause the timer and T to toggle themes.",
          ],
          duration: 5000
        });
        setHasShownTip(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [hasShownTip, isMobile, notificationPermission]);

  return { hasShownTip };
}
