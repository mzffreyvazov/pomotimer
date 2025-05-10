import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/sonner";
import { useIsMobileScreen } from './use-is-mobile-screen';

export function useSpacebarTip() {
  const [hasShownTip, setHasShownTip] = useState<boolean>(false);
  const isMobile = useIsMobileScreen();

  useEffect(() => {
    // Don't show spacebar tip on mobile devices
    if (!hasShownTip && !isMobile) {
      // Use a small delay so the tip appears after the page has loaded
      const timer = setTimeout(() => {
        toast("Keyboard shortcut available", {
          description: "You can press the spacebar to start and pause the timer",
          duration: 6000
        });
        setHasShownTip(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [hasShownTip, isMobile]);

  return { hasShownTip };
}
