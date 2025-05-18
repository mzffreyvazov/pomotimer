/* File: d:\Downloads\code\code\Extra-Projects\mellow-timer-glow\src\components\GoalCard.tsx */

import React from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
// Removed Card, CardHeader, CardContent as GoalCard is now a section
import { cn } from '@/lib/utils';
import { TaskList } from './TaskList';
import { EllipsisVertical, Pencil } from 'lucide-react';
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
  const { goal, clearGoal, setGoalName, setGoal } = useTimer();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(goal?.name || 'Focus Goal');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const spanRef = React.useRef<HTMLSpanElement>(null);
  const [isEditTimeDialogOpen, setIsEditTimeDialogOpen] = React.useState(false);
  const [editTimeInput, setEditTimeInput] = React.useState(goal?.targetHours?.toString() || '');

  React.useEffect(() => {
    setNameInput(goal?.name || 'Focus Goal');
  }, [goal?.name]);

  React.useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditingName]);

  React.useEffect(() => {
    if (inputRef.current && spanRef.current) {
      inputRef.current.style.width = spanRef.current.offsetWidth + 2 + 'px';
    }
  }, [nameInput, isEditingName]);

  React.useEffect(() => {
    setEditTimeInput(goal?.targetHours?.toString() || '');
  }, [goal?.targetHours]);

  React.useEffect(() => {
    if (isEditTimeDialogOpen) {
      // Reset to current goal hours when dialog opens
      setEditTimeInput(goal?.targetHours?.toString() || '');
    }
  }, [isEditTimeDialogOpen, goal?.targetHours]);

  const handleNameSave = () => {
    const trimmed = nameInput.trim() || 'Focus Goal';
    setGoalName(trimmed);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setNameInput(goal?.name || 'Focus Goal');
      setIsEditingName(false);
    }
  };

  const handleEditTimeSave = () => {
    const newHours = parseFloat(editTimeInput);
    if (!isNaN(newHours) && newHours > 0 && goal) {
      setGoal({ ...goal, targetHours: newHours });
      setIsEditTimeDialogOpen(false);
    }
  };

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
      "px-6 py-6 rounded-lg relative",
      isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
    )}>
      {/* Name and menu in a flex row for alignment */}
      <div className="mb-6 flex flex-row items-center justify-between gap-2">
        <div>
          {isEditingName ? (
            <>
              <input
                ref={inputRef}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleNameKeyDown}
                className={cn(
                  'text-xl font-bold bg-transparent outline-none border-none p-0 m-0',
                  isDark ? 'text-white' : 'text-[#09090b]',
                  isEditingName
                    ? (isDark
                        ? 'bg-white/5 border-b-2 border-pomo-primary'
                        : 'bg-gray-100 border-b-2 border-pomo-primary')
                    : ''
                )}
                style={{
                  width: 'auto',
                  minWidth: '1ch',
                  maxWidth: '100%',
                  whiteSpace: 'pre',
                  verticalAlign: 'middle',
                  background: isEditingName
                    ? (isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6')
                    : 'none',
                }}
                aria-label="Edit session name"
                spellCheck={false}
              />
              {/* Hidden span for auto-width calculation */}
              <span
                ref={spanRef}
                className={cn('invisible absolute whitespace-pre pointer-events-none text-xl font-bold', isDark ? 'text-white' : 'text-[#09090b]')}
                style={{ padding: 0, margin: 0 }}
                aria-hidden
              >
                {nameInput || 'Focus Goal'}
              </span>
            </>
          ) : (
            <span
              className={cn(
                'text-[20px] font-semibold select-text relative group',
                isDark ? 'text-white' : 'text-[#09090b]'
              )}
              style={{ cursor: 'text', display: 'inline-block' }}
              tabIndex={0}
              onClick={() => setIsEditingName(true)}
              onKeyDown={e => { if (e.key === 'Enter') setIsEditingName(true); }}
            >
              {goal.name || 'Focus Goal'}
            </span>
          )}
        </div>
        <div>
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
                  'cursor-pointer',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors'
                )}
                onSelect={() => setIsEditingName(true)}
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className={cn(
                  'cursor-pointer',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors'
                )}
                onSelect={() => setIsEditTimeDialogOpen(true)}
              >
                Edit Time
              </DropdownMenuItem>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
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
      <Dialog open={isEditTimeDialogOpen} onOpenChange={setIsEditTimeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal Time</DialogTitle>
            <DialogDescription>
              Adjust the target hours for your current focus goal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label 
              htmlFor="editTime" 
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                isDark ? "text-white" : "text-gray-700"
              )}
            >
              Target Hours
            </label>
            <input
              id="editTime"
              type="number"
              min="0.5"
              step="0.5"
              value={editTimeInput}
              onChange={e => setEditTimeInput(e.target.value)}
              placeholder="e.g., 4.5"
              className={cn(
                'w-full border rounded px-3 py-2',
                'appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                isDark ? 'bg-pomo-muted/50 text-white' : 'bg-pomo-muted/30 text-[#09090b]'
              )}
              style={{ MozAppearance: 'textfield' }}
            />
            <p className="text-xs text-pomo-secondary mt-1.5">
              Set a new target duration (minimum 0.5 hours). Your progress will be adjusted accordingly.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTimeDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleEditTimeSave}
              disabled={!editTimeInput || parseFloat(editTimeInput) < 0.5}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}