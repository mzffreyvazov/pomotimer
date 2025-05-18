/* File: d:\Downloads\code\code\Extra-Projects\mellow-timer-glow\src\components\GoalCard.tsx */

import React from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
// Removed Card, CardHeader, CardContent as GoalCard is now a section
import { cn } from '@/lib/utils';
import { TaskList } from './TaskList';
import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface GoalCardProps {
  onEditClick?: () => void;
  onClearClick?: () => void;
}

export function GoalCard({ onEditClick, onClearClick }: GoalCardProps) {
  const { goal, clearGoal } = useTimer();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
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
      "p-6 rounded-lg relative",
      isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
    )}>
      {/* Three-dot menu */}
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'p-1 h-8 w-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100',
                isDark && 'text-white/60 hover:text-white hover:bg-white/10'
              )}
              aria-label="Open goal menu"
            >
              <EllipsisVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className={cn(
                "text-destructive bg-transparent cursor-pointer transition-colors",
                "focus:bg-destructive/90 focus:text-white",
                "hover:bg-destructive/90 hover:text-white"
              )}
              onSelect={() => setIsDeleteDialogOpen(true)}
            >
              Delete
            </DropdownMenuItem>
            {/* Future: <DropdownMenuItem onSelect={onEditClick}>Edit</DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Focus Goal?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your current focus goal? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearGoal();
                setIsDeleteDialogOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}