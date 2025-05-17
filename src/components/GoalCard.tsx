import React from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Settings, Trash2 } from 'lucide-react';
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
  
  // Calculate progress percentage
  const progressPercentage = Math.min(100, Math.round((goal.currentHours / goal.targetHours) * 100));
  
  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className={cn(
      "shadow-md transition-all duration-300",
      isDark ? "bg-pomo-muted/30 border border-pomo-muted/50 text-white" : "bg-white border border-pomo-muted/30 text-[#221F26]"
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Focus Goal</CardTitle>
          <div className="flex gap-2">
            {onEditClick && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onEditClick}
                className={cn(
                  isDark ? "text-white hover:bg-pomo-muted/30" : "text-[#221F26] hover:bg-pomo-muted/30"
                )}
              >
                <Settings size={16} className="mr-1" />
                <span>Edit</span>
              </Button>
            )}
            {onClearClick && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearClick} 
                className={cn(
                  "text-red-500",
                  isDark ? "hover:bg-pomo-muted/30" : "hover:bg-pomo-muted/30"
                )}
              >
                <Trash2 size={16} className="mr-1" />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={cn(isDark ? "text-white/70" : "text-muted-foreground")}>Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="flex justify-between text-sm">
            <span className={cn(isDark ? "text-white/70" : "text-muted-foreground")}>Remaining</span>
            <span className="font-medium">{(goal.targetHours - goal.currentHours).toFixed(1)} hours</span>
          </div>
        </div>
        
        {/* Task List */}
        <TaskList />
      </CardContent>
    </Card>
  );
}