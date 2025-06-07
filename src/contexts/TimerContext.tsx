import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { toast } from "@/components/ui/sonner";
import { useNotification } from '@/hooks/use-notification';
import { getSoundPath } from '@/lib/sounds';
import { saveSessionToSupabase, getUserSessions } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext'; // Added import

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
  goalName?: string;
  totalWorkTime: number;
  cyclesCompleted: number;
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
  isSoundControlLocked: boolean;
  setBackgroundSound: (sound: SoundOption) => void;
  setBackgroundVolume: (volume: number) => void;
  toggleSoundControlLock: () => void;
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
  addSession: (session: Omit<Session, 'id' | 'date'>, skipGoalProgressUpdate?: boolean) => void;
  clearSessions: () => void;
  refreshSessions: () => void;
  deleteSession: (sessionId: string) => void;
  
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
const GOAL_COMPLETION_ANIMATION_DELAY = 1000; // milliseconds for perceived animation

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Access auth context
  const { user } = useAuth();
  
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
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        
        // Convert string dates back to Date objects
        const parsedSessions = parsed.map((session: any) => ({
          ...session,
          date: new Date(session.date)
        }));
        
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
  const [isSoundControlLocked, setIsSoundControlLocked] = useState<boolean>(() => {
    // Try to load from localStorage
    const savedValue = localStorage.getItem('soundControlLocked');
    return savedValue ? JSON.parse(savedValue) : false;
  });
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  
  // Audio refs
  // alarmRef is no longer needed for timer completion sound
  const backgroundSoundRef = useRef<HTMLAudioElement | null>(null);
  const previewSoundRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add notification hook
  const { permission, requestPermission, sendNotification: sendBrowserNotification } = useNotification(); // Renamed to avoid conflict
  const { playAlarmSound } = useNotifications(); // Get playAlarmSound from NotificationContext
  
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
  
  // Refresh sessions when user changes (logs in/out)
  useEffect(() => {
    if (user) {
      refreshSessions();
    } else {
      // If user logs out, refresh from localStorage to apply guest limits if necessary
      refreshSessions();
    }
  }, [user]);
  
  // Save goal to localStorage when it changes
  useEffect(() => {
    if (goal) {
      localStorage.setItem('timerGoal', JSON.stringify(goal));
    } else {
      localStorage.removeItem('timerGoal');
    }
  }, [goal]);
  
  // Initialize audio (alarmRef related useEffect is removed)
  // useEffect(() => {
  //   alarmRef.current = new Audio('/alarm.mp3');
  //   // Ensure volume is set initially
  //   if (alarmRef.current) alarmRef.current.volume = 0.5; // Default alarm volume, or make configurable
  //   return () => {
  //     if (alarmRef.current) {
  //       alarmRef.current.pause();
  //       alarmRef.current = null;
  //     }
  //   };
  // }, []);
  
  // Add a session to the history
  const addSession = async (
    sessionData: Omit<Session, 'id' | 'date'>,
    skipGoalProgressUpdate = false
  ) => {
    const newSession: Session = {
      id: Date.now().toString(),
      date: new Date(),
      goalName: sessionData.goalName || goal?.name, // Use sessionData.goalName first, then current goal
      totalWorkTime: sessionData.totalWorkTime,
      cyclesCompleted: sessionData.cyclesCompleted
    };
    
    setSessions(prevSessions => {
      let updatedSessions;
      if (!user && prevSessions.length >= 3) {
        updatedSessions = [newSession, ...prevSessions.slice(0, 2)];
        try {
          window.dispatchEvent(new CustomEvent('SESSION_LIMIT_REACHED'));
        } catch (e) {
          console.error('Failed to dispatch session limit event', e);
        }
      } else {
        updatedSessions = [newSession, ...prevSessions];
      }
      try {
        localStorage.setItem('timerSessions', JSON.stringify(updatedSessions));
      } catch (e) {
        console.error('Failed to save sessions to localStorage', e);
      }
      return updatedSessions;
    });
    
    if (user) {
      try {
        let tasksToSave = undefined;
        // Use tasks from sessionData if provided (e.g. from a completed goal), otherwise from current goal
        const tasksSource = sessionData.goalName && goal?.name === sessionData.goalName ? goal.tasks : undefined;

        if (tasksSource && tasksSource.length > 0) {
          tasksToSave = tasksSource.map((task, index) => ({
            title: task.title,
            is_completed: task.isCompleted,
            sort_order: index,
            estimated_minutes: undefined 
          }));
        }

        const savedSession = await saveSessionToSupabase(
          {
            session_name: newSession.goalName || "Focus Session",
            focus_duration: newSession.totalWorkTime,
            is_completed: true 
          },
          tasksToSave
        );
        
        if (savedSession) {
          console.log('Session saved to Supabase:', savedSession);
        }
      } catch (error) {
        console.error('Error saving session to Supabase:', error);
      }
    }
    
    if (goal && !skipGoalProgressUpdate) {
      const hoursWorked = sessionData.totalWorkTime / 60;
      updateGoalProgress(hoursWorked);
    }
  };
  
  // Clear all sessions
  const clearSessions = async () => {
    // If user is logged in, try to clear from Supabase first
    if (user) {
      try {
        const { clearUserSessionsFromSupabase } = await import('@/lib/supabaseClient');
        await clearUserSessionsFromSupabase();
      } catch (error) {
        console.error('Error clearing sessions from Supabase:', error);
      }
    }
    
    // Always clear local state
    setSessions([]);
    // Also remove sessions from localStorage
    localStorage.removeItem('timerSessions');
  };
  
  // Internal helper for goal completion actions
  const performGoalCompletionActions = (completedGoalData: Goal): void => {
    toast("Goal Achieved! 🎉", {
      description: `You've completed your goal: "${completedGoalData.name || 'Focus Goal'}"!`,
    });

    const goalSessionData: Omit<Session, 'id' | 'date'> = {
      goalName: completedGoalData.name,
      cyclesCompleted: 0, 
      totalWorkTime: Math.round(completedGoalData.targetHours * 60)
    };

    const newSessionEntry: Session = {
      id: Date.now().toString(),
      date: new Date(),
      ...goalSessionData
    };
    
    setSessions(prevSessions => {
      let updatedSessionsList;
      if (!user && prevSessions.length >= 3) {
        updatedSessionsList = [newSessionEntry, ...prevSessions.slice(0, 2)];
        try { window.dispatchEvent(new CustomEvent('SESSION_LIMIT_REACHED')); } catch (e) { console.error('Failed to dispatch session limit event', e); }
      } else {
        updatedSessionsList = [newSessionEntry, ...prevSessions];
      }
      try { localStorage.setItem('timerSessions', JSON.stringify(updatedSessionsList)); } catch (e) { console.error('Failed to save sessions to localStorage', e); }
      return updatedSessionsList;
    });

    if (user) {
      let tasksToSave = undefined;
      if (completedGoalData.tasks && completedGoalData.tasks.length > 0) {
        tasksToSave = completedGoalData.tasks.map((task, index) => ({
          title: task.title,
          is_completed: true, 
          sort_order: index,
          estimated_minutes: undefined 
        }));
      }
      saveSessionToSupabase(
        {
          session_name: newSessionEntry.goalName || "Focus Session",
          focus_duration: newSessionEntry.totalWorkTime,
          is_completed: true
        },
        tasksToSave
      ).then(saved => {
        if (saved) console.log('Session from goal completion saved to Supabase:', saved);
      }).catch(err => console.error('Error saving session from goal completion to Supabase:', err));
    }

    window.dispatchEvent(new CustomEvent(GOAL_COMPLETED_EVENT));
    // This function no longer returns goal data or sets state directly.
    // The calling function will handle clearing the goal.
  };
  
  // Set a new goal
  const setGoal = (newGoalData: Goal) => {
    setGoalState(prevGoal => {
      const isNewDataIndicatingCompletion = newGoalData.isCompleted && newGoalData.currentHours >= newGoalData.targetHours;
      const wasPreviouslyCompleted = prevGoal?.isCompleted && prevGoal?.currentHours >= prevGoal?.targetHours;
      const justMarkedCompletedByThisCall = isNewDataIndicatingCompletion && !wasPreviouslyCompleted;

      if (justMarkedCompletedByThisCall) {
        const tasksAllCompleted = (newGoalData.tasks || []).map(task => ({ ...task, isCompleted: true }));
        const finalCompletedState = { 
          ...newGoalData, 
          currentHours: newGoalData.targetHours, // Ensure current hours are at target
          tasks: tasksAllCompleted,
          isCompleted: true, // Ensure isCompleted is true
          endDate: newGoalData.endDate || new Date() 
        };
        
        // Set state for UI to update and show completion
        // Then, schedule subsequent actions (logging session, clearing goal)
        setTimeout(() => {
          performGoalCompletionActions(finalCompletedState);
          setTimeout(() => {
            setGoalState(null); // Clear the goal after animation delay
          }, GOAL_COMPLETION_ANIMATION_DELAY);
        }, 50); // Short delay to allow UI to render completed state first

        return finalCompletedState; // Return the completed state for immediate UI update
      }

      // Default update if not "just marked completed" by this call
      return {
        ...newGoalData,
        isCompleted: newGoalData.isCompleted !== undefined ? newGoalData.isCompleted : (prevGoal?.isCompleted || false),
        tasks: newGoalData.tasks || (prevGoal?.tasks || [])
      };
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
  
  };
  
  // Update goal progress with additional hours
  const updateGoalProgress = (additionalHours: number) => {
    setGoalState(currentGoal => {
      if (!currentGoal) return null;
    
      const newCurrentHours = currentGoal.currentHours + additionalHours;
      const isBecomingComplete = !currentGoal.isCompleted && newCurrentHours >= currentGoal.targetHours;
    
      if (isBecomingComplete) {
        const tasksAllCompleted = (currentGoal.tasks || []).map(task => ({ ...task, isCompleted: true }));
        const finalCompletedState = {
          ...currentGoal,
          currentHours: currentGoal.targetHours, 
          isCompleted: true, 
          endDate: new Date(),
          tasks: tasksAllCompleted
        };

        // Set state for UI to update and show completion
        // Then, schedule subsequent actions
        setTimeout(() => {
          performGoalCompletionActions(finalCompletedState);
          setTimeout(() => {
            setGoalState(null); // Clear the goal after animation delay
          }, GOAL_COMPLETION_ANIMATION_DELAY);
        }, 50); // Short delay for UI render

        return finalCompletedState; // Return completed state for immediate UI update
      } else if (newCurrentHours < currentGoal.targetHours) {
        return {
          ...currentGoal,
          currentHours: newCurrentHours
        };
      } else if (currentGoal.isCompleted) {
        return {
          ...currentGoal,
          currentHours: currentGoal.targetHours 
        };
      }
      return currentGoal; 
    });

    // Remove the old standalone timeout for clearGoal as it's now integrated above
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

  // Toggle sound control lock
  const toggleSoundControlLock = () => {
    setIsSoundControlLocked(prev => {
      const newState = !prev;
      // Save to localStorage
      try {
        localStorage.setItem('soundControlLocked', JSON.stringify(newState));
      } catch (e) {
        console.error('Failed to save sound control lock state to localStorage', e);
      }
      return newState;
    });

    // Notify user about the lock state change
    toast(isSoundControlLocked ? "Sound panel unlocked" : "Sound panel locked", {
      description: isSoundControlLocked ? "Panel will expand on hover" : "Panel will stay collapsed",
      duration: 1500
    });
  };

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
      playAlarmSound(); // Use playAlarmSound from NotificationContext

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
            goalName: goal?.name,
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
      
      // Update goal progress if a goal exists
      // This call will now use the refactored updateGoalProgress
      if (goal && !goal.isCompleted) { // Only update if goal is not already marked completed
         updateGoalProgress(focusHours);
      }
    } else if (mode === 'break') {
      // Only add a session when the last break of the cycle completes
      if (sessionsCompleted + 1 === cycleCount) {
        addSession({
          goalName: goal?.name,
          cyclesCompleted: cycleCount,
          totalWorkTime: focusTime * cycleCount,
        });
      }
      // Send notification when break completes
      sendBrowserNotification( // Use renamed browser notification function
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
      // if (alarmRef.current) { // alarmRef removed
      //   alarmRef.current.pause();
      //   alarmRef.current = null;
      // }
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
  const refreshSessions = async () => {
    // If user is logged in, fetch from Supabase
    if (user) {
      try {
        // Get sessions from Supabase
        const supabaseSessions = await getUserSessions();
        
        // Map Supabase sessions to our app's session format
        if (supabaseSessions.length > 0) {
          const formattedSessions: Session[] = supabaseSessions.map(dbSession => ({
            id: dbSession.id,
            date: new Date(dbSession.session_date),
            goalName: dbSession.session_name || "Focus Session",
            totalWorkTime: dbSession.focus_duration,
            cyclesCompleted: Math.ceil(dbSession.focus_duration / focusTime) || 1
          }));
          
          setSessions(formattedSessions);
          return formattedSessions;
        }
      } catch (error) {
        console.error('Error fetching sessions from Supabase:', error);
      }
    }
    
    // Fallback to localStorage if user is not logged in or Supabase fetch fails
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

  // Delete a single session by id
  const deleteSession = async (sessionId: string) => {
    // If user is logged in, try to delete from Supabase first
    if (user) {
      try {
        const { deleteSessionFromSupabase } = await import('@/lib/supabaseClient');
        await deleteSessionFromSupabase(sessionId);
      } catch (error) {
        console.error('Error deleting session from Supabase:', error);
      }
    }
    
    // Always update local state
    setSessions(prevSessions => {
      const updatedSessions = prevSessions.filter(session => session.id !== sessionId);
      try {
        localStorage.setItem('timerSessions', JSON.stringify(updatedSessions));
      } catch (e) {
        console.error('Failed to save sessions to localStorage', e);
      }
      return updatedSessions;
    });
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
        isSoundControlLocked,
        setBackgroundSound: handleSetBackgroundSound,
        setBackgroundVolume,
        toggleSoundControlLock,
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
        deleteSession,
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