
import React from 'react';
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
    longBreakInterval
  } = useTimer();
  
  // Format time (m:ss)
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage for the timer circle
  const getProgress = (): number => {
    let totalSeconds: number;
    const { mode, timeRemaining, focusTime, shortBreakTime, longBreakTime } = useTimer();
    
    switch(mode) {
      case 'focus':
        totalSeconds = focusTime * 60;
        break;
      case 'shortBreak':
        totalSeconds = shortBreakTime * 60;
        break;
      case 'longBreak':
        totalSeconds = longBreakTime * 60;
        break;
    }
    
    // Calculate percentage remaining (inverted for circle animation)
    return ((totalSeconds - timeRemaining) / totalSeconds) * 100;
  };
  
  // Calculate radius and circumference for SVG circle
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = getProgress();
  const dashOffset = circumference - (progress / 100) * circumference;
  
  // Mode label displayed above timer
  const getModeLabel = (): string => {
    switch(mode) {
      case 'focus': return 'Focus Session';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
    }
  };

  // Get color for the current mode
  const getModeColor = (): string => {
    switch(mode) {
      case 'focus': return 'bg-pomo-primary/20 text-pomo-primary border-pomo-primary/30';
      case 'shortBreak': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'longBreak': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  // Get stroke color for timer circle
  const getStrokeColor = (): string => {
    switch(mode) {
      case 'focus': return 'stroke-pomo-primary';
      case 'shortBreak': return 'stroke-green-400';
      case 'longBreak': return 'stroke-blue-400';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <span className={cn("px-3 py-1 rounded-lg text-sm font-medium border animate-fade-in mb-4", getModeColor())}>
        {getModeLabel()}
      </span>
      
      <div className="relative flex justify-center items-center mb-6">
        {/* Timer circle */}
        <svg width="280" height="280" className="rotate-[-90deg] transform">
          {/* Background circle */}
          <circle 
            cx="140" 
            cy="140" 
            r={radius} 
            className="stroke-pomo-muted/30 stroke-[4] fill-none" 
          />
          
          {/* Progress circle */}
          <circle 
            cx="140" 
            cy="140" 
            r={radius} 
            className={cn("transition-all duration-1000 ease-linear fill-none stroke-[4]", getStrokeColor())}
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
              {Array.from({ length: longBreakInterval }, (_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300", 
                    i < (sessionsCompleted % longBreakInterval) 
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
      <div className="flex justify-center space-x-4 mt-2">
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
