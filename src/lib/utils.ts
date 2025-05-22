import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Function to optimize mobile performance without affecting desktop
 * Call this in your main component to add hardware acceleration for mobile
 */
export function optimizeMobilePerformance() {
  if (typeof window === 'undefined') return;
  
  // Only run on mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  if (isMobile) {
    // Add a class to the document root for mobile-specific optimizations
    document.documentElement.classList.add('mobile-device');
    
    // Fix for the progress circle - ensure it's properly initialized
    // This runs after a slight delay to make sure DOM is ready
    setTimeout(() => {
      const progressCircle = document.getElementById('progress-circle');
      if (progressCircle instanceof SVGCircleElement) {
        // Get the current stroke-dasharray
        const computedStyle = getComputedStyle(progressCircle);
        const dashArray = computedStyle.getPropertyValue('stroke-dasharray');
        
        // Set it explicitly to ensure consistency
        if (dashArray) {
          progressCircle.style.strokeDasharray = dashArray;
          
          // Temporarily remove transition to avoid animation on first render
          const originalTransition = progressCircle.style.transition;
          progressCircle.style.transition = 'none';
          
          // Force a reflow to apply the changes immediately
          progressCircle.getBoundingClientRect();
          
          // Restore transition after a tick
          setTimeout(() => {
            progressCircle.style.transition = originalTransition;
          }, 50);
        }
      }
    }, 100);
    
    // Detect battery status if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        // Add low battery class if below 20%
        if (battery.level < 0.2 && !battery.charging) {
          document.documentElement.classList.add('low-battery');
        }
        
        // Listen for changes in battery status
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2 && !battery.charging) {
            document.documentElement.classList.add('low-battery');
          } else {
            document.documentElement.classList.remove('low-battery');
          }
        });
        
        battery.addEventListener('chargingchange', () => {
          if (battery.level < 0.2 && !battery.charging) {
            document.documentElement.classList.add('low-battery');
          } else {
            document.documentElement.classList.remove('low-battery');
          }
        });
      }).catch(() => {
        // Battery API failed, nothing to do
      });
    }
    
    // Optimize scrolling to pause animations during scroll
    let scrollTimeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      document.documentElement.classList.add('scrolling');
      
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        document.documentElement.classList.remove('scrolling');
      }, 100); // Remove class 100ms after scrolling stops
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Handle device orientation changes to re-optimize on rotation
    window.addEventListener('orientationchange', () => {
      // Add a temporary class for orientation change
      document.documentElement.classList.add('orientation-change');
      
      // Remove it after animations should be complete
      setTimeout(() => {
        document.documentElement.classList.remove('orientation-change');
      }, 300);
    });
    
    // Detect low-memory devices (if supported by browser)
    if ('deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory < 4) { // Less than 4GB RAM
        document.documentElement.classList.add('low-memory-device');
      }
    }
  }
}
