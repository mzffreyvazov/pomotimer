import React, { useState, useRef, useEffect } from 'react';
import { useTimer, Task } from '@/contexts/TimerContext'; // Added Task
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Clock, Target, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface GoalPreviewDrawerProps {
  onOpenSessionsPanel: () => void;
  isHidden?: boolean;
}

export function GoalPreviewDrawer({ onOpenSessionsPanel, isHidden }: GoalPreviewDrawerProps) {
  const { goal, isActive, isPaused, toggleTaskCompletion } = useTimer(); // Added toggleTaskCompletion
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Collapse when clicking outside
  useEffect(() => {
    if (!isExpanded) return;
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isExpanded]);

  // Only show if there's an active goal, timer is actually running (not paused), AND not hidden by parent
  if (isHidden || !goal || !isActive || isPaused) {
    return null;
  }

  const completedTasks = goal.tasks.filter(task => task.isCompleted).length;
  const totalTasks = goal.tasks.length;
  const timeRemaining = Math.max(0, goal.targetHours - goal.currentHours);
  const progressPercentage = goal.targetHours > 0 ? (goal.currentHours / goal.targetHours) * 100 : 0;

  const formatTimeRemaining = (hours: number) => {
    if (hours <= 0) return "Goal completed!";
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours === 0) {
      return `${minutes}m left`;
    }
    if (minutes === 0) {
      return `${wholeHours}h left`;
    }
    return `${wholeHours}h ${minutes}m left`;
  };  return (    <div 
      ref={drawerRef}
      className={cn(
        "fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 rounded-t-2xl border border-pomo-muted/60 transition-all duration-500 ease-out",
        isDark 
          ? "bg-pomo-background shadow-lg shadow-black/30" 
          : "bg-pomo-background shadow-lg shadow-gray-300/50"
      )}
      style={{
        transform: `translate(-50%, ${isExpanded ? '0' : 'calc(100% - 70px)'})`,
        maxHeight: isExpanded ? '400px' : '70px',
        height: 'auto',
      }}
    >
      <div className="h-full flex flex-col">
        {/* Header/Collapsed Content */}
        <div 
          className="flex-shrink-0 px-4 py-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Target size={16} className="text-pomo-primary flex-shrink-0" />
                <span className="text-[15px] font-medium text-pomo-foreground truncate">
                  {goal.name || 'Focus Goal'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-pomo-secondary">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  {completedTasks}/{totalTasks} tasks
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
            </div>
            {isExpanded ? (
              <ChevronDown size={20} className="text-pomo-secondary ml-2 flex-shrink-0" />
            ) : (
              <ChevronUp size={20} className="text-pomo-secondary ml-2 flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        <div          className={cn(
            "overflow-hidden transition-all duration-300",
            isExpanded ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="border-t border-pomo-muted/30">
            <div className="px-4 py-4 space-y-4"> {/* Removed overflow-y-auto and max-h-[300px] */}


              {/* Tasks Preview */}
              {totalTasks > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-pomo-foreground">Tasks</span>
                    <span className="text-sm text-pomo-secondary">
                      {completedTasks}/{totalTasks} completed
                    </span>
                  </div>
                  
                  <div className="space-y-2 overflow-y-auto max-h-[110px] pr-1"> {/* Added scrollability and max height */}
                    {goal.tasks.map((task: Task) => ( // Iterate over all tasks, added Task type
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg transition-all duration-200 cursor-pointer", // Increased gap, added cursor-pointer
                          isDark 
                            ? "bg-pomo-muted/30 hover:bg-pomo-muted/40" 
                            : "bg-pomo-muted/20 hover:bg-pomo-muted/30"
                        )}
                        onClick={() => toggleTaskCompletion(task.id)} // Handles clicks on the row
                      >
                        {/* Removed wrapper div, added onClick to Checkbox for stopPropagation */}
                        <Checkbox
                          id={`drawer-task-${task.id}`}
                          checked={task.isCompleted}
                          onCheckedChange={() => toggleTaskCompletion(task.id)} // Handles the state toggle
                          onClick={(e) => e.stopPropagation()} // Prevents click from bubbling to the parent row div
                          className={cn(
                            "h-4 w-4 rounded-[5px] border-2 transition-all duration-200 flex-shrink-0",
                            isDark 
                              ? "border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                              : "border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          )}
                        />
                        <span 
                          className={cn(
                            "text-sm flex-1 truncate",
                            task.isCompleted 
                              ? "line-through text-pomo-secondary" 
                              : "text-pomo-foreground"
                          )}
                        >
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View Full Goal Button */}
              <Button
                onClick={() => {
                  setIsExpanded(false);
                  onOpenSessionsPanel(); // Use the passed prop
                }}
                variant="ghost"
                size="sm"
                className="w-full hover:bg-pomo-muted/40 transition-colors duration-300"
              >
                <Target size={16} className="" />
                View Goal
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
