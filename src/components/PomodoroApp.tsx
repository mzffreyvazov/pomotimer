import React, { useState, useEffect, useRef } from 'react';
import { TimerProvider, useTimer } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
import TimerDisplay from './TimerDisplay';
import TimerSettings from './TimerSettings';
import SoundControl from './SoundControl';
import { NotificationPrompt } from './NotificationPrompt';
import { ThemeToggle } from './ThemeToggle';
import { cn, optimizeMobilePerformance } from '@/lib/utils';
import { useSpacebarTip } from '@/hooks/use-spacebar-tip';

interface PomodoroContentProps {
  showAuthModal: () => void;
}

// Inner component to access context
const PomodoroContent: React.FC<PomodoroContentProps> = ({ showAuthModal }) => {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const { isActive, isPaused } = useTimer();
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Initialize the spacebar tip
  useSpacebarTip();

  // Apply mobile optimizations when component mounts
  useEffect(() => {
    optimizeMobilePerformance();
  }, []);

  // Attribute for smooth animation on mobile
  // Using data attribute to target in CSS
  const timerState = isActive && !isPaused ? "true" : "false";

  return (
    <>
      <div className={cn(
        "fixed inset-0 min-h-screen w-full flex justify-center items-center bg-pomo-background",
        isDark ? "bg-[#221F26]" : ""
      )}>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div 
          ref={containerRef}
          className={cn(
            "pomodoro-container transition-all duration-300 w-full max-w-md mx-auto",
            showSettings ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
          )}
          data-timer-active={timerState}
          data-animation-state={isActive ? (isPaused ? "paused" : "active") : "inactive"}
        >
          <TimerDisplay onOpenSettings={() => setShowSettings(true)} />
          <SoundControl />
        </div>
        
        <div className={cn(
          "fixed inset-0 flex items-center justify-center transition-all duration-300",
          isDark 
            ? "backdrop-blur-sm bg-[#221F26]/30" 
            : "backdrop-blur-sm bg-pomo-background/30",
          showSettings ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          <div className="p-6 w-full max-w-md mx-4">
            <TimerSettings onClose={() => setShowSettings(false)} />
          </div>
        </div>
      </div>
      
      {/* Notification permission prompt */}
      <NotificationPrompt />
    </>
  );
};

interface PomodoroAppProps {
  showAuthModal: () => void;
}

// Main component with provider
const PomodoroApp: React.FC<PomodoroAppProps> = ({ showAuthModal }) => {
  return (
    <TimerProvider>
      <PomodoroContent showAuthModal={showAuthModal} />
    </TimerProvider>
  );
};

export default PomodoroApp;
