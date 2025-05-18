/* File: d:\Downloads\code\code\Extra-Projects\mellow-timer-glow\src\components\GoalCard.tsx */

import React from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
// Removed Card, CardHeader, CardContent as GoalCard is now a section
import { cn } from '@/lib/utils';
import { TaskList } from './TaskList';

interface GoalCardProps {
  onEditClick?: () => void;
  onClearClick?: () => void;
}

export function GoalCard({ onEditClick, onClearClick }: GoalCardProps) {
  const { goal } = useTimer();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (!goal) {
    return null;
  }
  
  const progressPercentage = Math.min(100, Math.round((goal.currentHours / goal.targetHours) * 100));
  const hoursLeft = Math.max(0, goal.targetHours - goal.currentHours);
  
  // Format remaining time as 'Xh Ym' (e.g., 2h 36m)
  function formatHoursMinutes(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    let result = '';
    if (h > 0) result += `${h}h`;
    if (m > 0 || h === 0) result += `${h > 0 ? ' ' : ''}${m}m`;
    return result.trim();
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={cn(
      "p-6 rounded-lg",
      isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
    )}>
      <h3 className="text-base font-medium mb-6">
        Focus Goal
      </h3>
      
      <div className="space-y-6">
        {/* Progress Section */}
        <div>
          {/* New progress info line */}
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium" style={{ fontWeight: 500 }}>
              {progressPercentage}% done
            </span>
            <span className="text-sm" style={{ fontWeight: 300 }}>
              {formatHoursMinutes(hoursLeft)} left
            </span>
          </div>
          {/* Progress bar */}
          <div className={cn(
            "h-2 w-full rounded-full",
            isDark ? "bg-pomo-muted/30" : "bg-pomo-muted/50"
          )}>
            <div 
              className="h-full rounded-full bg-pomo-primary transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Tasks Section */}
        <TaskList />
      </div>
    </div>
  );
}