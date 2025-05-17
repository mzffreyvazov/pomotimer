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
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-pomo-secondary">
                Progress
              </span>
              <span className="text-sm font-medium">
                {progressPercentage}%
              </span>
            </div>
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

          <div className="flex justify-between items-center">
            <span className="text-sm text-pomo-secondary">
              Remaining
            </span>
            <span className="text-sm font-medium">
              {(goal.targetHours - goal.currentHours).toFixed(1)} hours
            </span>
          </div>
        </div>

        {/* Tasks Section */}
        <TaskList />
      </div>
    </div>
  );
}