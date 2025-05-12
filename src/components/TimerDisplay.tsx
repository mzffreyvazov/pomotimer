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
    breakTime,
    allowDragging,
    setTimeRemaining
  } = useTimer();
  
  // Refs for optimization
  const progressCircleRef = useRef<SVGCircleElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isMobileRef = useRef<boolean>(false);
  const [circleInitialized, setCircleInitialized] = useState(false);
  const prevTimerStateRef = useRef<{ isActive: boolean, isPaused: boolean }>({ isActive, isPaused });

  // Add drag-related state and refs
  const isDraggingRef = useRef<boolean>(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStartAngleRef = useRef<number>(0);
  const dragStartTimeRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false); // Track dragging state for UI
  // Add state for immediate handle position during drag
  const [immediateHandlePos, setImmediateHandlePos] = useState<{x: number, y: number} | null>(null);

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
    // Prevent division by zero if totalSeconds is 0
    if (totalSeconds <= 0) {
      return 0;
    }
    // Calculate percentage elapsed
    const progressPercent = ((totalSeconds - timeRemaining) / totalSeconds) * 100;
    // Clamp the result between 0 and 100 to handle potential floating point issues
    return Math.max(0, Math.min(100, progressPercent));
  };
  
  // Calculate radius and circumference for SVG circle
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = getProgress();
  
  const dashOffset = circumference - (progress / 100) * circumference;
  
  // Calculate position for the drag handle based on progress
  const getHandlePosition = () => {
    const angleDeg = -1 + (progress / 100 * 360);
    const angleRad = angleDeg * (Math.PI / 180); 
    const x = 140 + radius * Math.cos(angleRad);
    const y = 140 + radius * Math.sin(angleRad);

    // Log the values when handle position is calculated
    console.log(`Handle Pos: progress=${progress.toFixed(1)}%, angleDeg=${angleDeg.toFixed(1)}, x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
    
    return { x, y };
  };
  
  // Helper function to get angle from mouse/touch event - better constrained to circle
  const getAngleFromEvent = (e: MouseEvent | TouchEvent): number => {
    if (!svgRef.current) return 0;
    
    // Calculate the center relative to the viewport
    const svgRect = svgRef.current.getBoundingClientRect();
    const centerX = svgRect.left + svgRect.width / 2;
    const centerY = svgRect.top + svgRect.height / 2;
    
    // Get client coordinates based on event type
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Calculate delta values relative to the center
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    // Calculate angle in radians using atan2(y, x)
    let angleRad = Math.atan2(deltaY, deltaX);

    // Convert to degrees (range -180 to 180)
    let angleDeg = angleRad * (180 / Math.PI);

    // Adjust for the SVG's -90 degree rotation:
    // atan2=0 (right) should become 90 degrees (visual right)
    // atan2=90 (bottom) should become 180 degrees (visual bottom)
    // atan2=180 (left) should become 270 degrees (visual left)
    // atan2=-90 (top) should become 0 degrees (visual top)
    let adjustedDegrees = angleDeg + 90;

    // Normalize to 0-360 range
    if (adjustedDegrees < 0) {
      adjustedDegrees += 360;
    }

    // Ensure it doesn't exceed 360 (can happen with floating point inaccuracies near 0)
    return adjustedDegrees % 360;
  };
  

  
  // Remove this function, it's no longer needed with the direct mapping approach
  // const angleToTimeDifference = (angleDiff: number): number => { ... };

  // Handle drag start - check allowDragging setting
  const handleDragStart = (e: React.MouseEvent<SVGCircleElement> | React.TouchEvent<SVGCircleElement>) => {
    // Don't allow dragging if the setting is disabled
    if (!allowDragging) return;
    
    if (isActive && !isPaused) return;
    e.stopPropagation();
    isDraggingRef.current = true;
    setIsDragging(true);
    e.preventDefault(); // Prevent default text selection/scrolling

    // Attach listeners to the document for smoother dragging outside the element
    if ('touches' in e.nativeEvent) {
      document.addEventListener('touchmove', handleDragMove, { passive: false }); // passive: false needed for preventDefault
      document.addEventListener('touchend', handleDragEnd);
    } else {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    }
  };


  // Handle drag move - ensure smooth circular movement
  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;

    // Prevent default to avoid scrolling on touch devices
    e.preventDefault();

    // Calculate angle from drag position - this gives us position on the circle
    const currentAngle = getAngleFromEvent(e);
    
    // Calculate the total duration for the current mode
    const totalSeconds = getTotalSeconds();
    
    // Convert angle to time - this ensures we're moving around the circle properly
    // Angle 0 is top, 90 is right, 180 is bottom, 270 is left, 360 is back to top
    const progressPercent = (currentAngle / 360) * 100;
    const timeElapsed = Math.round((progressPercent / 100) * totalSeconds);
    let newTime = totalSeconds - timeElapsed;
    
    // Constrain to valid range (0 to total duration)
    newTime = Math.max(0, Math.min(totalSeconds, newTime));
    
    // Update time remaining - this will in turn update the progress and handle position
    setTimeRemaining(newTime);
    
    // We don't need immediateHandlePos since we're adjusting the real time value
    // which will update the progress, which will position the handle correctly
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    
    // Reset dragging state
    isDraggingRef.current = false;
    setIsDragging(false);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
  };
  
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
      // Immediately disable any transition on mode change
      progressCircleRef.current.style.transition = 'none';
      
      // Force browser reflow
      void progressCircleRef.current.getBoundingClientRect();
      
      // Update circle position without animation
      const newOffset = circumference - (getProgress() / 100) * circumference;
      progressCircleRef.current.style.strokeDashoffset = newOffset.toString();
      
      // Only re-enable transition if the timer is active
      if (isActive && !isPaused) {
        // Short delay to ensure the transition is re-enabled after position is set
        setTimeout(() => {
          if (progressCircleRef.current) {
            progressCircleRef.current.style.transition = isMobileRef.current 
              ? 'none' // On mobile RAF handles this
              : 'stroke-dashoffset 1000ms linear';
          }
        }, 50);
      }
    }
  }, [mode, isActive, isPaused]);
  
  // Effect to handle skip button clicks to prevent animation glitches
  useEffect(() => {
    // Listen for skip button click
    const skipButton = document.querySelector('[data-skip-button="true"]');
    
    const handleSkip = () => {
      // Immediately disable transition to prevent animation
      if (progressCircleRef.current) {
        progressCircleRef.current.style.transition = 'none';
      }
    };
    
    if (skipButton) {
      skipButton.addEventListener('click', handleSkip);
      return () => skipButton.removeEventListener('click', handleSkip);
    }
  }, []);
  
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
      
      <div className="relative flex justify-center items-center mb-3 timer-circle-area">
        {/* Timer circle */}
        <svg 
          id="timer-svg-circle-progress"
          ref={svgRef}
          width="280" 
          height="280" 
          className={cn(
            "rotate-[-90deg] transform transition-transform duration-300",
            isDragging && "scale-105" // Zoom effect when dragging
          )}
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
            className={cn(
              "fill-none", 
              getStrokeColor(),
              {
                "transition-all duration-1000 ease-linear": !isMobileRef.current && !isDraggingRef.current && isActive && !isPaused,
                "cursor-pointer hover:stroke-opacity-80": allowDragging && (!isActive || isPaused), // Visual indicator that it's draggable only if allowed
                "stroke-[4]": !isDragging,
                "stroke-[5]": isDragging // Make stroke thicker when dragging
              }
            )}
            style={{ 
              strokeDasharray: circumference,
              strokeDashoffset: dashOffset,
              strokeLinecap: 'round' 
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          />
          
          {/* Drag handle at current position - only show if dragging is allowed */}
          {allowDragging && (isPaused || !isActive) && (
            <>
              {/* Larger invisible touch target + visible handle combined */}
              <circle
                cx={getHandlePosition().x}
                cy={getHandlePosition().y}
                r={isDragging ? 6 : 5}
                className={cn(
                  "transition-none cursor-pointer",
                  isDragging 
                    ? mode === 'focus'
                      ? "fill-pomo-primary shadow-lg" 
                      : "fill-green-400 shadow-lg"
                    : mode === 'focus'
                      ? "fill-pomo-primary/90 hover:fill-pomo-primary" 
                      : "fill-green-400/90 hover:fill-green-400"
                )}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              />
            </>
          )}
        </svg>
        
        {/* Time display */}
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-[400] tracking-tight animate-fade-in tracking-tighter">
            {formatTime(timeRemaining)}
          </span>
          
          {/* Add hint that timer is draggable when paused */}
          {allowDragging && (isPaused || !isActive) && (
            <span className="text-xs text-pomo-muted mt-1 animate-fade-in">
              Drag to adjust time
            </span>
          )}
          
          <div className="mt-4 flex space-x-3 items-center">
            <div className="flex space-x-3">
              {/* Session indicators */}
              {Array.from({ length: cycleCount }, (_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300", 
                    i < (sessionsCompleted === cycleCount ? cycleCount : sessionsCompleted % cycleCount) 
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
      <div className="flex justify-center space-x-4 mt-1 timer-action-buttons" id="timer-action-buttons">
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
          data-skip-button="true"
          className="bg-pomo-muted/50 hover:bg-pomo-muted border-pomo-muted/70"
        >
          <ArrowRight size={18} />
        </Button>
      </div>
      
      {/* Settings button */}
      <Button 
        id="timer-settings-btn"
        variant="ghost" 
        className="mt-3 text-pomo-secondary hover:text-pomo-foreground" 
        onClick={onOpenSettings}
      >
        <Settings size={16} className="mr-1" />
        <span className="text-sm">Settings</span>
      </Button>
    </div>
  );
};

export default TimerDisplay;