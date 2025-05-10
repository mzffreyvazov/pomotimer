import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { toast } from "@/components/ui/sonner";
import { useNotification } from '@/hooks/use-notification';
import { getSoundPath } from '@/lib/sounds';

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
  previewSound: (sound: SoundOption) => void;
  togglePreview: (sound: SoundOption) => boolean;
  isPreviewPlaying: boolean;
  
  // Methods
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  setMode: (mode: TimerMode) => void;
  setAutoStartBreaks: (autoStart: boolean) => void;
  toggleTimer: () => void; // New method to toggle timer state
  updateSettings: (settings: {
    focusTime?: number;
    breakTime?: number;
    cycleCount?: number;
    autoStartBreaks?: boolean;
  }) => void;
  
  // Notification-related properties
  requestNotificationPermission: () => Promise<boolean>;
  notificationPermission: NotificationPermission | 'default';
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
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  
  // Audio refs
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const backgroundSoundRef = useRef<HTMLAudioElement | null>(null);
  const previewSoundRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add notification hook
  const { permission, requestPermission, sendNotification } = useNotification();
  
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

  // Request notification permission on first mount if timer is active
  useEffect(() => {
    if (isActive && permission === 'default') {
      requestPermission();
    }
  }, [isActive, permission, requestPermission]);

  // Handle background sound
  useEffect(() => {
    // Clean up previous sound
    if (backgroundSoundRef.current) {
      backgroundSoundRef.current.pause();
      backgroundSoundRef.current = null;
    }
    
    // Setup new sound if selected
    if (backgroundSound !== 'none') {
      // Get the correct path for the sound
      const soundPath = getSoundPath(backgroundSound);
      
      try {
        backgroundSoundRef.current = new Audio(soundPath);
        backgroundSoundRef.current.loop = true;
        backgroundSoundRef.current.volume = backgroundVolume / 100;
        
        // Only play if timer is active and not paused
        if (isActive && !isPaused) {
          backgroundSoundRef.current.play().catch(err => 
            console.error("Could not play background sound:", err)
          );
        }
      } catch (error) {
        console.error("Error creating audio object:", error);
      }
    }
    
    return () => {
      if (backgroundSoundRef.current) {
        backgroundSoundRef.current.pause();
        backgroundSoundRef.current = null;
      }
    };
  }, [backgroundSound, backgroundVolume, isActive, isPaused]);
  
  // Handle play/pause state changes
  useEffect(() => {
    if (backgroundSoundRef.current) {
      if (isActive && !isPaused) {
        // Only try to play if it's not already playing
        if (backgroundSoundRef.current.paused) {
          backgroundSoundRef.current.play().catch(err => 
            console.error("Could not play background sound on state change:", err)
          );
        }
      } else {
        // Always pause when timer is not active or is paused
        backgroundSoundRef.current.pause();
      }
    }
  }, [isActive, isPaused]);
  
  // Handle volume changes
  useEffect(() => {
    if (backgroundSoundRef.current) {
      backgroundSoundRef.current.volume = backgroundVolume / 100;
    }
    if (previewSoundRef.current) {
      previewSoundRef.current.volume = backgroundVolume / 100;
    }
  }, [backgroundVolume]);
  
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
    
    // Handle notifications based on which timer completed
    if (mode === 'focus') {
      // Send notification if we're moving to break mode and the page is not visible
      sendNotification(
        "Focus session completed!",
        { 
          body: `Time for a ${breakTime} minute break.`,
          icon: "/icon.png" // Add an icon file to your public folder
        }
      );
      
      // Auto-start breaks if enabled
      if (autoStartBreaks) {
        setTimeout(() => {
          setIsActive(true);
          setIsPaused(false);
        }, 500); // Small delay for better UX
      }
    } else if (mode === 'break') {
      // Send notification when break ends and the page is not visible
      sendNotification(
        "Break completed!",
        { 
          body: "Time to focus again!",
          icon: "/icon.png"
        }
      );
    }
  };
  
  // Timer controls
  const startTimer = () => {
    setIsActive(true);
    setIsPaused(false);
    
    // Stop any playing preview sound
    if (isPreviewPlaying && previewSoundRef.current) {
      previewSoundRef.current.pause();
      previewSoundRef.current = null;
      
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      
      setIsPreviewPlaying(false);
    }
    
    // Ensure sound plays when timer starts
    if (backgroundSoundRef.current && backgroundSound !== 'none') {
      backgroundSoundRef.current.play().catch(err => 
        console.error("Could not play sound when starting timer:", err)
      );
    }
  };
  
  const pauseTimer = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    
    // Control sound based on pause state
    if (backgroundSoundRef.current) {
      if (newPausedState) {
        backgroundSoundRef.current.pause();
      } else {
        backgroundSoundRef.current.play().catch(err => 
          console.error("Could not play sound when resuming timer:", err)
        );
      }
    }
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
    
    // Ensure sound stops when timer is reset
    if (backgroundSoundRef.current) {
      backgroundSoundRef.current.pause();
    }
  };
  
  // Toggle timer between play/pause states
  const toggleTimer = () => {
    if (!isActive) {
      // Stop any playing preview when starting timer
      if (isPreviewPlaying && previewSoundRef.current) {
        previewSoundRef.current.pause();
        previewSoundRef.current = null;
        
        if (previewTimeoutRef.current) {
          clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }
        
        setIsPreviewPlaying(false);
      }
      startTimer();
    } else {
      pauseTimer();
    }
  };
  
  const skipTimer = () => {
    // Skip to next timer
    const nextMode = getNextMode();
    if (mode === 'focus') {
      setSessionsCompleted(prev => prev + 1);
    }
    setMode(nextMode);
    
    // Ensure any playing sound stops when skipping
    if (backgroundSoundRef.current) {
      backgroundSoundRef.current.pause();
    }
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
  
  // Function to update background sound and stop any preview
  const handleSetBackgroundSound = (sound: SoundOption) => {
    // Stop any playing preview
    if (isPreviewPlaying && previewSoundRef.current) {
      previewSoundRef.current.pause();
      previewSoundRef.current = null;
      
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      
      setIsPreviewPlaying(false);
    }
    
    // Set the new background sound
    setBackgroundSound(sound);
  };
  
  // Preview sound function
  const previewSound = (sound: SoundOption) => {
    // Don't preview if no sound selected
    if (sound === 'none') return;
    
    // Stop any existing preview
    if (previewSoundRef.current) {
      previewSoundRef.current.pause();
      previewSoundRef.current = null;
    }
    
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    
    // Get the correct path for the sound
    const soundPath = getSoundPath(sound);
    
    try {
      previewSoundRef.current = new Audio(soundPath);
      previewSoundRef.current.volume = backgroundVolume / 100;
      previewSoundRef.current.play().catch(err => 
        console.error("Could not play preview sound:", err)
      );
      
      // Set preview state to playing
      setIsPreviewPlaying(true);
      
      // Stop preview after 5 seconds
      previewTimeoutRef.current = setTimeout(() => {
        if (previewSoundRef.current) {
          previewSoundRef.current.pause();
          previewSoundRef.current = null;
        }
        previewTimeoutRef.current = null;
        setIsPreviewPlaying(false);
      }, 5000);
    } catch (error) {
      console.error("Error creating preview audio object:", error);
    }
  };
  
  // Toggle preview sound (play/pause)
  const togglePreview = (sound: SoundOption): boolean => {
    // Don't preview if no sound selected
    if (sound === 'none') return false;
    
    // If already playing, pause it
    if (isPreviewPlaying && previewSoundRef.current) {
      previewSoundRef.current.pause();
      
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      
      setIsPreviewPlaying(false);
      return false;
    }
    
    // If not playing or different sound, start a new preview
    // Get the correct path for the sound
    const soundPath = getSoundPath(sound);
    
    try {
      // If we already have a preview sound ref but it's paused, resume it
      if (previewSoundRef.current) {
        previewSoundRef.current.play().catch(err => 
          console.error("Could not resume preview sound:", err)
        );
      } else {
        // Create new audio instance
        previewSoundRef.current = new Audio(soundPath);
        previewSoundRef.current.volume = backgroundVolume / 100;
        previewSoundRef.current.play().catch(err => 
          console.error("Could not play preview sound:", err)
        );
      }
      
      // Set preview state to playing
      setIsPreviewPlaying(true);
      
      // Clear any existing timeout
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      
      // Set timeout to stop preview after 5 seconds
      previewTimeoutRef.current = setTimeout(() => {
        if (previewSoundRef.current) {
          previewSoundRef.current.pause();
          previewSoundRef.current = null;
        }
        previewTimeoutRef.current = null;
        setIsPreviewPlaying(false);
      }, 5000);
      
      return true;
    } catch (error) {
      console.error("Error creating preview audio object:", error);
      return false;
    }
  };
  
  // Clean up audio elements on unmount
  useEffect(() => {
    return () => {
      // Clean up all audio elements
      if (alarmRef.current) {
        alarmRef.current.pause();
        alarmRef.current = null;
      }
      if (backgroundSoundRef.current) {
        backgroundSoundRef.current.pause();
        backgroundSoundRef.current = null;
      }
      if (previewSoundRef.current) {
        previewSoundRef.current.pause();
        previewSoundRef.current = null;
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
    };
  }, []);
  // Add event listener for space key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        toggleTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleTimer]);
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
        setBackgroundSound: handleSetBackgroundSound,
        setBackgroundVolume,
        previewSound,
        togglePreview,
        isPreviewPlaying,
        startTimer,
        pauseTimer,
        resetTimer,
        skipTimer,
        setMode,
        setAutoStartBreaks,
        toggleTimer,
        updateSettings,
        // Notification methods
        requestNotificationPermission: requestPermission,
        notificationPermission: permission,
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
