import React, { useState } from 'react';
import { TimerProvider, useTimer } from '@/contexts/TimerContext';
import TimerDisplay from './TimerDisplay';
import TimerSettings from './TimerSettings';
import SoundControl from './SoundControl';
import { cn } from '@/lib/utils';

// New inner component
const PomodoroAppContent: React.FC = () => {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const { isActive, isPaused } = useTimer(); // This call is now safely within TimerProvider's context

  return (
    <>
      <div className="fixed inset-0 min-h-screen w-full flex justify-center items-center bg-pomo-background">
        <div 
          className={cn(
            "pomodoro-container transition-all duration-300 w-full max-w-md mx-auto",
            showSettings ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
          )}
          data-timer-active={(isActive && !isPaused).toString()}
        >
          <TimerDisplay onOpenSettings={() => setShowSettings(true)} />
          <SoundControl />
        </div>
        
        <div className={cn(
          "fixed inset-0 flex items-center justify-center transition-all duration-300 backdrop-blur-sm bg-pomo-background/30",
          showSettings ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          <div className="p-6 w-full max-w-md mx-4">
            <TimerSettings onClose={() => setShowSettings(false)} />
          </div>
        </div>
      </div>
    </>
  );
};

const PomodoroApp: React.FC = () => {
  // The useTimer() call has been moved to PomodoroAppContent
  return (
    <TimerProvider>
      <PomodoroAppContent />
    </TimerProvider>
  );
};

export default PomodoroApp;
