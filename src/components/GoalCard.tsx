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
      "p-4 rounded-lg",
      isDark ? "text-white bg-pomo-muted/10" : "text-gray-900 bg-white"
    )}>      <div className="mb-4">
        <h3 className={cn(
          "text-base font-medium",
          isDark ? "text-white/90" : "text-gray-800"
        )}>
          Focus Goal
        </h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className={cn(
              isDark ? "text-white/60" : "text-gray-500"
            )}>
              Progress
            </span>
            <span className={cn(
              "font-medium",
              isDark ? "text-white/90" : "text-gray-900"
            )}>
              {progressPercentage}%
            </span>
          </div>
          <div className={cn(
            "h-2 rounded-full w-full overflow-hidden",
            isDark ? "bg-pomo-muted/20" : "bg-gray-100"
          )}>
            <div 
              className="h-full rounded-full bg-pomo-primary transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
          
        <div className="flex justify-between text-xs">
          <span className={cn(
            isDark ? "text-white/60" : "text-gray-500"
          )}>
            Remaining
          </span>
          <span className={cn(
            "font-medium",
            isDark ? "text-white/90" : "text-gray-900"
          )}>
            {(goal.targetHours - goal.currentHours).toFixed(1)} hours
          </span>
        </div>
        
        {/* Task List */}
        <TaskList />
      </div>
    </div>
  );
}