import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { toast } from "@/components/ui/sonner";

export type TimerMode = 'focus' | 'break';
export type SoundOption = 'none' | 'rain' | 'forest' | 'cafe' | 'whitenoise';

interface TimerContextType {
  // Timer settings
  focusTime: number;
  breakTime: number;
  cycleCount: number;
  autoStartBreaks: boolean;
  
  // Current timer state
  mode: TimerMode;
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  sessionsCompleted: number;
  
  // Sound settings
  backgroundSound: SoundOption;
  backgroundVolume: number;
  setBackgroundSound: (sound: SoundOption) => void;
  setBackgroundVolume: (volume: number) => void;
  
  // Methods
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  setMode: (mode: TimerMode) => void;
  setAutoStartBreaks: (autoStart: boolean) => void;
  updateSettings: (settings: {
    focusTime?: number;
    breakTime?: number;
    cycleCount?: number;
    autoStartBreaks?: boolean;
  }) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default settings (in minutes)
  const [focusTime, setFocusTime] = useState<number>(25);
  const [breakTime, setBreakTime] = useState<number>(5);
  const [cycleCount, setCycleCount] = useState<number>(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState<boolean>(true);
  
  // Timer state
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeRemaining, setTimeRemaining] = useState<number>(focusTime * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);
  
  // Sound settings
  const [backgroundSound, setBackgroundSound] = useState<SoundOption>('none');
  const [backgroundVolume, setBackgroundVolume] = useState<number>(50);
  
  // Audio refs
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const backgroundSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio
  useEffect(() => {
    alarmRef.current = new Audio('/alarm.mp3');
    return () => {
      if (alarmRef.current) {
        alarmRef.current.pause();
        alarmRef.current = null;
      }
    };
  }, []);

  // Handle background sound
  useEffect(() => {
    // Clean up previous sound
    if (backgroundSoundRef.current) {
      backgroundSoundRef.current.pause();
      backgroundSoundRef.current = null;
    }
    
    // Setup new sound if selected and in focus mode
    if (backgroundSound !== 'none') {
      const soundPath = `/sounds/${backgroundSound}.mp3`;
      backgroundSoundRef.current = new Audio(soundPath);
      backgroundSoundRef.current.loop = true;
      backgroundSoundRef.current.volume = backgroundVolume / 100;
      
      // Only play during focus sessions and when timer is active
      if (mode === 'focus' && isActive && !isPaused) {
        backgroundSoundRef.current.play().catch(err => 
          console.error("Could not play background sound:", err)
        );
      }
    }
    
    return () => {
      if (backgroundSoundRef.current) {
        backgroundSoundRef.current.pause();
        backgroundSoundRef.current = null;
      }
    };
  }, [backgroundSound, mode]);
  
  // Handle volume changes
  useEffect(() => {
    if (backgroundSoundRef.current) {
      backgroundSoundRef.current.volume = backgroundVolume / 100;
    }
  }, [backgroundVolume]);
  
  // Handle play/pause state changes
  useEffect(() => {
    if (backgroundSoundRef.current) {
      if (mode === 'focus' && isActive && !isPaused) {
        backgroundSoundRef.current.play().catch(err => 
          console.error("Could not play background sound:", err)
        );
      } else {
        backgroundSoundRef.current.pause();
      }
    }
  }, [isActive, isPaused, mode]);
  
  // Reset timer when mode changes
  useEffect(() => {
    let newTime: number;
    switch(mode) {
      case 'focus': 
        newTime = focusTime * 60;
        break;
      case 'break': 
        newTime = breakTime * 60;
        break;
    }
    setTimeRemaining(newTime);
    setIsActive(false);
    setIsPaused(false);
  }, [mode, focusTime, breakTime]);
  
  // Timer ticker
  useEffect(() => {
    let interval: number | undefined;
    
    if (isActive && !isPaused && timeRemaining > 0) {
      interval = window.setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      // Timer completed
      if (alarmRef.current) {
        alarmRef.current.play()
          .catch(error => console.error("Audio playback failed:", error));
      }

      // Show notification when timer completes
      const nextMode = getNextMode();
      toast(`${mode.charAt(0).toUpperCase() + mode.slice(1)} session completed!`, {
        description: `Time for ${nextMode === 'focus' ? 'focus' : 'a break'}!`,
      });
      
      if (mode === 'focus') {
        setSessionsCompleted(prev => prev + 1);
      }
      
      // Automatically switch to next mode
      handleTimerComplete();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeRemaining]);
  
  // Get next timer mode
  const getNextMode = (): TimerMode => {
    if (mode === 'focus') {
      return 'break';
    } else {
      return 'focus';
    }
  };
  
  // Handle timer completion
  const handleTimerComplete = () => {
    const nextMode = getNextMode();
    setMode(nextMode);
    setIsActive(false);
    setIsPaused(false);
    
    // Auto-start breaks if enabled and coming from focus mode
    if (mode === 'focus' && autoStartBreaks) {
      setTimeout(() => {
        setIsActive(true);
        setIsPaused(false);
      }, 500); // Small delay for better UX
    }
  };
  
  // Timer controls
  const startTimer = () => {
    setIsActive(true);
    setIsPaused(false);
  };
  
  const pauseTimer = () => {
    setIsPaused(!isPaused);
  };
  
  const resetTimer = () => {
    // Reset current timer without changing mode
    let newTime: number;
    switch(mode) {
      case 'focus': 
        newTime = focusTime * 60;
        break;
      case 'break': 
        newTime = breakTime * 60;
        break;
    }
    setTimeRemaining(newTime);
    setIsActive(false);
    setIsPaused(false);
  };
  
  const skipTimer = () => {
    // Skip to next timer
    const nextMode = getNextMode();
    if (mode === 'focus') {
      setSessionsCompleted(prev => prev + 1);
    }
    setMode(nextMode);
  };
  
  // Update timer settings
  const updateSettings = (settings: {
    focusTime?: number;
    breakTime?: number;
    cycleCount?: number;
    autoStartBreaks?: boolean;
  }) => {
    if (settings.focusTime !== undefined) setFocusTime(settings.focusTime);
    if (settings.breakTime !== undefined) setBreakTime(settings.breakTime);
    if (settings.cycleCount !== undefined) setCycleCount(settings.cycleCount);
    if (settings.autoStartBreaks !== undefined) setAutoStartBreaks(settings.autoStartBreaks);
    
    // Reset the current timer if its settings were changed
    if (
      (mode === 'focus' && settings.focusTime !== undefined) ||
      (mode === 'break' && settings.breakTime !== undefined)
    ) {
      resetTimer();
    }
    
    toast("Settings updated", {
      description: "Your timer settings have been updated."
    });
  };
  
  return (
    <TimerContext.Provider
      value={{
        focusTime,
        breakTime,
        cycleCount,
        autoStartBreaks,
        mode,
        timeRemaining,
        isActive,
        isPaused,
        sessionsCompleted,
        backgroundSound,
        backgroundVolume,
        setBackgroundSound,
        setBackgroundVolume,
        startTimer,
        pauseTimer,
        resetTimer,
        skipTimer,
        setMode,
        setAutoStartBreaks,
        updateSettings
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
