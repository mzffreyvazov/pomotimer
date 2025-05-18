import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { toast } from "@/components/ui/sonner";
import { useNotification } from '@/hooks/use-notification';
import { getSoundPath } from '@/lib/sounds';

export type TimerMode = 'focus' | 'break';
export type SoundOption = 'none' | 'rain' | 'forest' | 'cafe' | 'whitenoise';

// New Task interface
export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
}

// New types for session tracking
export interface Session {
  id: string;
  date: Date;
  focusDuration: number; // in minutes
  breakDuration: number; // in minutes
  cyclesCompleted: number;
  totalWorkTime: number; // in minutes
}

export interface Goal {
  name?: string;
  targetHours: number;
  currentHours: number;
  startDate: Date;
  endDate?: Date;
  isCompleted: boolean;
  tasks: Task[]; // Added tasks array
}

interface TimerContextType {
  // Timer settings
  focusTime: number;
  breakTime: number;
  cycleCount: number;
  autoStartBreaks: boolean;
  allowDragging: boolean;
  
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
  setTimeRemaining: (seconds: number) => void;
  setAutoStartBreaks: (autoStart: boolean) => void;
  toggleTimer: () => void; // New method to toggle timer state
  toggleDragging: () => void; // Toggle timer dragging
  updateSettings: (settings: {
    focusTime?: number;
    breakTime?: number;
    cycleCount?: number;
    autoStartBreaks?: boolean;
    allowDragging?: boolean;
  }) => void;
  
  // Session tracking
  sessions: Session[];
  addSession: (session: Omit<Session, 'id' | 'date'>, updateGoal?: boolean) => void;
  clearSessions: () => void;
  refreshSessions: () => void;
  
  // Goal tracking
  goal: Goal | null;
  setGoal: (goal: Goal) => void;
  updateGoalProgress: (additionalHours: number) => void;
  clearGoal: () => void;
  setGoalName: (name: string) => void;
  
  // New task methods
  addTask: (title: string) => void;
  toggleTaskCompletion: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  
  // Notification-related properties
  requestNotificationPermission: () => Promise<boolean>;
  notificationPermission: NotificationPermission | 'default';
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Goal completion event
export const GOAL_COMPLETED_EVENT = 'goal-completed';

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default settings (in minutes)
  const [focusTime, setFocusTime] = useState<number>(25);
  const [breakTime, setBreakTime] = useState<number>(5);
  const [cycleCount, setCycleCount] = useState<number>(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState<boolean>(true);
  const [allowDragging, setAllowDragging] = useState<boolean>(false);
  
  // Timer state
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeRemaining, setTimeRemaining] = useState<number>(focusTime * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);
  
  // Session tracking
  const [sessions, setSessions] = useState<Session[]>(() => {
    const savedSessions = localStorage.getItem('timerSessions');
    console.log("Loading saved sessions from localStorage:", savedSessions);
    
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        
        // Convert string dates back to Date objects
        const parsedSessions = parsed.map((session: any) => ({
          ...session,
          date: new Date(session.date)
        }));
        
        console.log("Parsed sessions from localStorage:", parsedSessions);
        return parsedSessions;
      } catch (e) {
        console.error('Failed to parse sessions from localStorage', e);
        return [];
      }
    }
    console.log("No saved sessions found, returning empty array");
    return [];
  });
  
  // Goal tracking
  const [goal, setGoalState] = useState<Goal | null>(() => {
    const savedGoal = localStorage.getItem('timerGoal');
    if (savedGoal) {
      try {
        const parsed = JSON.parse(savedGoal);
        return {
          ...parsed,
          name: parsed.name || 'Focus Goal',
          startDate: new Date(parsed.startDate),
          endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
          isCompleted: false,
          tasks: Array.isArray(parsed.tasks) 
            ? parsed.tasks.map((task: any) => ({
              ...task,
              createdAt: new Date(task.createdAt),
              completedAt: task.completedAt ? new Date(task.completedAt) : undefined
            })) 
            : []
        };
      } catch (e) {
        console.error('Failed to parse goal from localStorage', e);
        return null;
      }
    }
    return null;
  });
  
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
  
  // Track completed work in the current cycle
  const currentCycleWork = useRef<number>(0);
  
  // Save sessions to localStorage when they change
  useEffect(() => {
    // We'll still have this as a backup, but we're also saving immediately in the add methods
    try {
      localStorage.setItem('timerSessions', JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to localStorage', e);
    }
  }, [sessions]);
  
  // Save goal to localStorage when it changes
  useEffect(() => {
    if (goal) {
      localStorage.setItem('timerGoal', JSON.stringify(goal));
    } else {
      localStorage.removeItem('timerGoal');
    }
  }, [goal]);
  
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
  
  // Add a session to the history
  const addSession = (sessionData: Omit<Session, 'id' | 'date'>, updateGoal: boolean = true) => {
    const newSession: Session = {
      ...sessionData,
      id: Date.now().toString(),
      date: new Date()
    };
    
    // First save to sessions state
    setSessions(prevSessions => {
      // Create the new array with the new session added at the beginning
      const updatedSessions = [newSession, ...prevSessions];
      
      // Directly save to localStorage here to ensure it persists
      try {
        localStorage.setItem('timerSessions', JSON.stringify(updatedSessions));
      } catch (e) {
        console.error('Failed to save sessions to localStorage', e);
      }
      
      return updatedSessions;
    });
    
    // If a goal exists and we should update progress
    if (updateGoal && goal) {
      const hoursWorked = sessionData.totalWorkTime / 60;
      updateGoalProgress(hoursWorked);
    }
  };
  
  // Clear all sessions
  const clearSessions = () => {
    setSessions([]);
    // Also remove sessions from localStorage
    localStorage.removeItem('timerSessions');
  };
  
  // Set a new goal
  const setGoal = (newGoal: Goal) => {
    // Ensure the isCompleted flag is initialized and tasks array exists
    setGoalState({
      ...newGoal,
      isCompleted: newGoal.isCompleted !== undefined ? newGoal.isCompleted : false,
      tasks: newGoal.tasks || []
    });
  };
  
  // Task management functions
  const addTask = (title: string) => {
    if (!goal) {
      toast("No active goal", {
        description: "Please create a goal before adding tasks."
      });
      return;
    }
    
    if (!title.trim()) {
      toast("Invalid task", {
        description: "Task title cannot be empty."
      });
      return;
    }
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: title.trim(),
      isCompleted: false,
      createdAt: new Date()
    };
    
    setGoalState(prevGoal => {
      if (!prevGoal) return null;
      return {
        ...prevGoal,
        tasks: [newTask, ...prevGoal.tasks]
      };
    });
    
    toast("Task added", {
      description: `"${title}" added to your goal.`
    });
  };
  
  const toggleTaskCompletion = (taskId: string) => {
    if (!goal) return;
    
    setGoalState(prevGoal => {
      if (!prevGoal) return null;
      
      const updatedTasks = prevGoal.tasks.map(task => {
        if (task.id === taskId) {
          const isCompleted = !task.isCompleted;
          return {
            ...task,
            isCompleted,
            completedAt: isCompleted ? new Date() : undefined
          };
        }
        return task;
      });
      
      return {
        ...prevGoal,
        tasks: updatedTasks
      };
    });
  };
  
  const deleteTask = (taskId: string) => {
    if (!goal) return;
    
    setGoalState(prevGoal => {
      if (!prevGoal) return null;
      
      const updatedTasks = prevGoal.tasks.filter(task => task.id !== taskId);
      
      return {
        ...prevGoal,
        tasks: updatedTasks
      };
    });
    
    toast("Task deleted", {
      description: "Task has been removed from your goal."
    });
  };
  
  // Update goal progress with additional hours
  const updateGoalProgress = (additionalHours: number) => {
    if (!goal) return;
    
    const newCurrentHours = goal.currentHours + additionalHours;
    const isGoalExactlyComplete = !goal.isCompleted && newCurrentHours >= goal.targetHours;
    
    // If goal isn't complete yet, just update progress
    if (newCurrentHours < goal.targetHours) {
      setGoalState({
        ...goal,
        currentHours: newCurrentHours
      });
      return;
    }
    
    // Cap progress at 100%
    const cappedHours = Math.min(newCurrentHours, goal.targetHours);
    
    // If this is the first time reaching 100%, handle completion
    if (isGoalExactlyComplete) {
      // Goal is achieved - handle completion
      toast("Goal Achieved! 🎉", {
        description: `You've reached your target of ${goal.targetHours} hours!`,
      });
      
      // Mark the goal as completed in state to prevent duplicate completion handling
      setGoalState({
        ...goal,
        currentHours: cappedHours,
        isCompleted: true,
        endDate: new Date()
      });
      
      // Create a goal completion session
      const goalSession: Omit<Session, 'id' | 'date'> = {
        focusDuration: 0, // Not applicable for goal tracking
        breakDuration: 0, // Not applicable for goal tracking
        cyclesCompleted: 0, // Special value to indicate this was a completed goal
        totalWorkTime: Math.round(goal.targetHours * 60) // Convert hours to minutes
      };
      
      // Add the session
      addSession(goalSession, false);
      
      // Let the UI update a bit before clearing the goal
      setTimeout(() => {
        // Clear the goal to reset UI
        clearGoal();
        
        // Dispatch custom event to notify components about goal completion
        window.dispatchEvent(new CustomEvent(GOAL_COMPLETED_EVENT));
      }, 300);
    } else {
      // Just update progress without completing again
      setGoalState({
        ...goal,
        currentHours: cappedHours
      });
    }
  };
  
  // Clear current goal
  const clearGoal = () => {
    setGoalState(null);
  };
  
  // Set goal name
  const setGoalName = (name: string) => {
    setGoalState(prev => prev ? { ...prev, name } : prev);
  };
  
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
      
      // If focus timer completed, add time to current cycle
      if (mode === 'focus') {
        currentCycleWork.current += focusTime;
      }
      
      // Increment session count after focus session
      if (mode === 'focus') {
        // Always increment sessions when focus completes, but make sure we don't exceed cycleCount
        const nextSessionCount = sessionsCompleted + 1;
        setSessionsCompleted(nextSessionCount <= cycleCount ? nextSessionCount : cycleCount);
        
        // Check if we've completed all cycles
        if (nextSessionCount >= cycleCount) {
          // Record the completed session
          addSession({
            focusDuration: focusTime,
            breakDuration: breakTime,
            cyclesCompleted: cycleCount,
            totalWorkTime: currentCycleWork.current
          });
          
          // Reset current cycle work tracking
          currentCycleWork.current = 0;
          
          toast("Cycle Complete! 🎉", {
            description: `You've completed ${cycleCount} focus sessions.`,
          });
        }
      } else if (mode === 'break') {
        // Only reset the counter after a break if we've completed all sessions
        if (sessionsCompleted >= cycleCount) {
          setSessionsCompleted(0);
        }
      }
      
      // Automatically switch to next mode
      handleTimerComplete();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, timeRemaining, mode, sessionsCompleted, cycleCount, focusTime, breakTime]);
  
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
      // Calculate focus session duration in hours
      const focusMinutes = focusTime;
      const focusHours = focusMinutes / 60;
      
      console.log(`Timer completed: Focus session of ${focusHours} hours`);
      
      // Update goal progress if a goal exists
      if (goal) {
        console.log(`Current goal progress: ${goal.currentHours} / ${goal.targetHours} hours`);
        
        const newCurrentHours = (goal.currentHours || 0) + focusHours;
        console.log(`New goal progress would be: ${newCurrentHours} / ${goal.targetHours} hours`);
        
        // Check if this focus session would complete the goal
        if (!goal.isCompleted && newCurrentHours >= goal.targetHours) {
          console.log(`Goal would be completed by this session! Creating goal completion session...`);
          
          // Goal is achieved - handle completion
          toast("Goal Achieved! 🎉", {
            description: `You've reached your target of ${goal.targetHours} hours!`,
          });
          
          // Create a goal completion session
          const goalSession: Omit<Session, 'id' | 'date'> = {
            focusDuration: 0, // Not applicable for goal tracking
            breakDuration: 0, // Not applicable for goal tracking
            cyclesCompleted: 0, // Special value to indicate this was a completed goal
            totalWorkTime: Math.round(goal.targetHours * 60) // Convert hours to minutes
          };
          
          // Add this as a session WITHOUT updating the goal again (to avoid infinite loop)
          addSession(goalSession, false);
          
          // Set the goal as completed
          setGoalState({
            ...goal,
            currentHours: goal.targetHours, // Cap at 100%
            isCompleted: true,
            endDate: new Date()
          });
          
          // Let the UI update a bit before clearing the goal
          setTimeout(() => {
            // Clear the goal to reset UI
            clearGoal();
            
            // Dispatch custom event to notify components about goal completion
            window.dispatchEvent(new CustomEvent(GOAL_COMPLETED_EVENT));
          }, 300);
        } else if (newCurrentHours < goal.targetHours) {
          console.log(`Updating goal progress to ${newCurrentHours} hours`);
          // Normal progress update, not yet complete
          setGoalState({
            ...goal,
            currentHours: newCurrentHours
          });
        } else {
          console.log(`Goal already completed, not updating progress`);
        }
      }
      // ...existing notification logic...
    } else if (mode === 'break') {
      // Only add a session when the last break of the cycle completes
      if (sessionsCompleted + 1 === cycleCount) {
        addSession({
          focusDuration: focusTime * cycleCount,
          breakDuration: breakTime * (cycleCount - 1),
          cyclesCompleted: cycleCount,
          totalWorkTime: focusTime * cycleCount,
        });
      }
      // Send notification when break completes
      sendNotification(
        "Break complete!",
        {
          body: "Ready to focus again?", 
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
    // First stop any active timer immediately to prevent animation issues
    setIsActive(false);
    setIsPaused(false);
    
    // Skip to next timer
    const nextMode = getNextMode();
    
    // Increment session count when skipping focus session
    if (mode === 'focus') {
      // Increment but don't exceed cycle count
      const nextSessionCount = sessionsCompleted + 1;
      setSessionsCompleted(nextSessionCount <= cycleCount ? nextSessionCount : cycleCount);
    } else if (mode === 'break') {
      // Reset counter after break if we've completed all sessions
      if (sessionsCompleted >= cycleCount) {
        setSessionsCompleted(0);
      }
    }
    
    // Set the new mode after state updates to prevent animation race conditions
    setTimeout(() => {
      setMode(nextMode);
    }, 0);
    
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
    allowDragging?: boolean;
  }) => {
    if (settings.focusTime !== undefined) setFocusTime(settings.focusTime);
    if (settings.breakTime !== undefined) setBreakTime(settings.breakTime);
    if (settings.cycleCount !== undefined) setCycleCount(settings.cycleCount);
    if (settings.autoStartBreaks !== undefined) setAutoStartBreaks(settings.autoStartBreaks);
    if (settings.allowDragging !== undefined) setAllowDragging(settings.allowDragging);
    
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
    
    // Stop any existing preview and clean up
    if (previewSoundRef.current) {
      previewSoundRef.current.pause();
      previewSoundRef.current = null;
    }
    
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    
    setIsPreviewPlaying(false); // Reset the state before starting new preview
    
    // Get the correct path for the sound
    const soundPath = getSoundPath(sound);
    
    try {
      // Create and configure new audio instance
      const newPreviewSound = new Audio(soundPath);
      newPreviewSound.volume = backgroundVolume / 100;
      
      // Only set the ref and state after successful play
      newPreviewSound.play()
        .then(() => {
          previewSoundRef.current = newPreviewSound;
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
        })
        .catch(err => {
          console.error("Could not play preview sound:", err);
          // Clean up on error
          newPreviewSound.pause();
          setIsPreviewPlaying(false);
        });
    } catch (error) {
      console.error("Error creating preview audio object:", error);
      setIsPreviewPlaying(false);
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

  // Manually set the time remaining (used for draggable timer)
  const manuallySetTimeRemaining = (seconds: number) => {
    // Ensure time is within valid range
    const currentTotalSeconds = mode === 'focus' ? focusTime * 60 : breakTime * 60;
    const boundedSeconds = Math.max(0, Math.min(currentTotalSeconds, seconds));
    
    // Update time remaining
    setTimeRemaining(boundedSeconds);
  };

  // Toggle dragging functionality
  const toggleDragging = () => {
    setAllowDragging(prev => !prev);
    
    // Show notification about the change
    toast(`Timer dragging ${!allowDragging ? 'enabled' : 'disabled'}`, {
      description: `You can ${!allowDragging ? 'now' : 'no longer'} adjust the timer by dragging the progress circle.`,
      duration: 2000 // Set duration to 2 seconds
    });
  };

  // Implement refreshSessions function
  const refreshSessions = () => {
    const savedSessions = localStorage.getItem('timerSessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed)) {
          // Convert string dates back to Date objects
          const parsedSessions = parsed.map((session: any) => ({
            ...session,
            date: new Date(session.date)
          }));
          setSessions(parsedSessions);
          return parsedSessions;
        }
      } catch (e) {
        console.error('Failed to parse sessions from localStorage', e);
      }
    }
    return [];
  };

  return (
    <TimerContext.Provider
      value={{
        focusTime,
        breakTime,
        cycleCount,
        autoStartBreaks,
        allowDragging,
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
        setTimeRemaining: manuallySetTimeRemaining,
        setAutoStartBreaks,
        toggleTimer,
        toggleDragging,
        updateSettings,
        sessions,
        addSession,
        clearSessions,
        refreshSessions,
        goal,
        setGoal,
        updateGoalProgress,
        clearGoal,
        setGoalName,
        // New task methods
        addTask,
        toggleTaskCompletion,
        deleteTask,
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