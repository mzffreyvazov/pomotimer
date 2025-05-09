import React, { useEffect, useRef, useState } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { Play, Pause, RefreshCw, ArrowRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  onOpenSettings: () => void;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ onOpenSettings }) => {
  const { 
    mode, 
    timeRemaining, 
    isActive, 
    isPaused, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    skipTimer,
    sessionsCompleted,
    cycleCount,
    focusTime,
    breakTime
  } = useTimer();
  
  // Refs for optimization
  const progressCircleRef = useRef<SVGCircleElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isMobileRef = useRef<boolean>(false);
  const [circleInitialized, setCircleInitialized] = useState(false);
  const prevTimerStateRef = useRef<{ isActive: boolean, isPaused: boolean }>({ isActive, isPaused });

  // Check if on mobile device
  useEffect(() => {
    isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }, []);

  // Add keyboard shortcut for spacebar to start/pause timer
  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (
        e.code === "Space" ||
        e.key === " " ||
        e.key === "Spacebar"
      ) {
        // Prevent space from scrolling the page
        e.preventDefault();
        if (isActive && !isPaused) {
          pauseTimer();
        } else {
          startTimer();
        }
      }
    };
    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  }, [isActive, isPaused, startTimer, pauseTimer]);
  
  // Format time (m:ss)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate total seconds for current mode
  const getTotalSeconds = (): number => {
    switch(mode) {
      case 'focus':
        return focusTime * 60;
      case 'break':
        return breakTime * 60;
      default:
        return focusTime * 60;
    }
  };
  
  // Calculate progress percentage for the timer circle
  const getProgress = (): number => {
    const totalSeconds = getTotalSeconds();
    // Calculate percentage remaining (inverted for circle animation)
    return ((totalSeconds - timeRemaining) / totalSeconds) * 100;
  };
  
  // Calculate radius and circumference for SVG circle
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = getProgress();
  const dashOffset = circumference - (progress / 100) * circumference;
  
  // Initialize circle on first render
  useEffect(() => {
    if (progressCircleRef.current && !circleInitialized) {
      // Set initial dashOffset to ensure proper starting point
      const initialOffset = circumference - (getProgress() / 100) * circumference;
      progressCircleRef.current.style.strokeDasharray = circumference.toString();
      progressCircleRef.current.style.strokeDashoffset = initialOffset.toString();
      setCircleInitialized(true);
    }
  }, []);
  
  // Handle mode changes to reset circle properly
  useEffect(() => {
    if (progressCircleRef.current) {
      // On mode change, update the circle position immediately
      const newOffset = circumference - (getProgress() / 100) * circumference;
      progressCircleRef.current.style.transition = 'none';
      progressCircleRef.current.style.strokeDashoffset = newOffset.toString();
      
      // Reset transition after a tick
      setTimeout(() => {
        if (progressCircleRef.current) {
          progressCircleRef.current.style.transition = isMobileRef.current 
            ? 'none' // On mobile RAF handles this
            : 'stroke-dashoffset 1000ms linear';
        }
      }, 50);
    }
  }, [mode]);
  
  // Use RAF for smoother circle animation on mobile
  useEffect(() => {
    // Only apply optimized animation on mobile
    if (isMobileRef.current && isActive && !isPaused) {
      const circle = progressCircleRef.current;
      
      if (circle) {
        // Cancel any existing animation
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Use requestAnimationFrame for smoother animation on mobile
        const animate = () => {
          if (circle) {
            circle.style.strokeDashoffset = dashOffset.toString();
          }
          animationFrameRef.current = requestAnimationFrame(animate);
        };
        
        animationFrameRef.current = requestAnimationFrame(animate);
        
        return () => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
        };
      }
    }
  }, [dashOffset, isActive, isPaused]);
  
  // Handle animation when timer status changes
  useEffect(() => {
    // Only run for mobile
    if (!isMobileRef.current) return;
    
    // Detect change in timer state (active → inactive or vice versa)
    const wasActive = prevTimerStateRef.current.isActive && !prevTimerStateRef.current.isPaused;
    const isActiveNow = isActive && !isPaused;
    const stateChanged = wasActive !== isActiveNow;
    
    // Update previous state for next check
    prevTimerStateRef.current = { isActive, isPaused };
    
    // If state changed, we need to handle the animation
    if (stateChanged) {
      // Handle circle animation
      if (progressCircleRef.current) {
        progressCircleRef.current.style.transition = 'none';
        progressCircleRef.current.style.strokeDashoffset = dashOffset.toString();
      }
      
      // Handle container animation for reverse transitions (when stopping timer)
      if (!isActiveNow && wrapperRef.current) {
        // Ultra-simplified animation for better performance on mobile
        // Get the container and wrapper
        const container = wrapperRef.current.closest('.pomodoro-container') as HTMLElement;
        const wrapper = wrapperRef.current;
        
        if (container && wrapper) {
          // Remove all transitions to start with a clean slate
          container.style.transition = 'none';
          wrapper.style.transition = 'none';
          
          // Force reflow
          void container.offsetWidth;
          
          // Apply scales immediately (no calculations)
          container.style.transform = '';
          wrapper.style.transform = '';
          
          // For extremely laggy devices, we could even skip animation altogether
          // and just snap to the final state
        }
      }
    }
  }, [isActive, isPaused, dashOffset]);
  
  // Mode label displayed above timer
  const getModeLabel = (): string => {
    switch(mode) {
      case 'focus': return 'Focus Session';
      case 'break': return 'Break';
    }
  };

  // Get color for the current mode
  const getModeColor = (): string => {
    switch(mode) {
      case 'focus': return 'bg-pomo-primary/20 text-pomo-primary border-pomo-primary/30';
      case 'break': return 'bg-green-500/20 text-green-300 border-green-500/30';
    }
  };

  // Get stroke color for timer circle
  const getStrokeColor = (): string => {
    switch(mode) {
      case 'focus': return 'stroke-pomo-primary';
      case 'break': return 'stroke-green-400';
    }
  };

  return (
    <div 
      ref={wrapperRef}
      className="flex flex-col items-center timer-display-wrapper"
    >
      <span className={cn("px-3 py-1 rounded-lg text-sm font-medium border animate-fade-in mb-4 timer-mode-label", getModeColor())}>
        {getModeLabel()}
      </span>
      
      <div className="relative flex justify-center items-center mb-6 timer-circle-area">
        {/* Timer circle */}
        <svg 
          id="timer-svg-circle-progress"
          width="280" 
          height="280" 
          className="rotate-[-90deg] transform"
        >
          {/* Background circle */}
          <circle 
            cx="140" 
            cy="140" 
            r={radius} 
            className="stroke-pomo-muted/30 stroke-[4] fill-none" 
          />
          
          {/* Progress circle */}
          <circle 
            id="progress-circle"
            ref={progressCircleRef}
            cx="140" 
            cy="140" 
            r={radius} 
            className={cn("fill-none stroke-[4]", getStrokeColor(), {
              // Only add this class on non-mobile
              "transition-all duration-1000 ease-linear": !isMobileRef.current
            })}
            style={{ 
              strokeDasharray: circumference,
              strokeDashoffset: dashOffset,
              strokeLinecap: 'round' 
            }}
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-semibold tracking-tight animate-fade-in">
            {formatTime(timeRemaining)}
          </span>
          
          <div className="mt-4 flex space-x-3 items-center">
            <div className="flex space-x-3">
              {/* Session indicators */}
              {Array.from({ length: cycleCount }, (_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300", 
                    i < (sessionsCompleted % cycleCount) 
                      ? "bg-pomo-primary" 
                      : "bg-pomo-muted/50"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timer controls */}
      <div className="flex justify-center space-x-4 mt-2 timer-action-buttons" id="timer-action-buttons">
        <Button 
          variant="outline"
          size="icon"
          onClick={resetTimer}
          className="bg-pomo-muted/50 hover:bg-pomo-muted border-pomo-muted/70"
        >
          <RefreshCw size={18} />
        </Button>
        
        <Button 
          size="icon"
          onClick={isActive ? pauseTimer : startTimer}
          className={cn(
            "w-12 h-12 rounded-full transition-all duration-300",
            isActive && !isPaused ? "bg-red-500 hover:bg-red-600" : "bg-pomo-primary/80 hover:bg-pomo-primary text-pomo-background"
          )}
        >
          {isActive && !isPaused ? <Pause size={20} /> : <Play size={20} />}
        </Button>
        
        <Button 
          variant="outline"
          size="icon"
          onClick={skipTimer}
          className="bg-pomo-muted/50 hover:bg-pomo-muted border-pomo-muted/70"
        >
          <ArrowRight size={18} />
        </Button>
      </div>
      
      {/* Settings button */}
      <Button 
        id="timer-settings-btn"
        variant="ghost" 
        className="mt-6 text-pomo-secondary hover:text-pomo-foreground" 
        onClick={onOpenSettings}
      >
        <Settings size={16} className="mr-1" />
        <span className="text-sm">Settings</span>
      </Button>
    </div>
  );
};

export default TimerDisplay;
