
import React, { useState } from 'react';
import { TimerProvider } from '@/contexts/TimerContext';
import TimerDisplay from './TimerDisplay';
import TimerSettings from './TimerSettings';
import { cn } from '@/lib/utils';

const PomodoroApp: React.FC = () => {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  return (
    <TimerProvider>
      <div className="fixed inset-0 min-h-screen w-full flex justify-center items-center bg-pomo-background">
        <div className={cn(
          "pomodoro-container transition-all duration-300 w-full max-w-md mx-auto",
          showSettings ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
        )}>
          <TimerDisplay onOpenSettings={() => setShowSettings(true)} />
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
    </TimerProvider>
  );
};

export default PomodoroApp;
