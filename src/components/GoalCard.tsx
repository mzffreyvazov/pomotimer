import React from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
// Removed Card, CardHeader, CardContent as GoalCard is now a section
import { cn } from '@/lib/utils';
import { TaskList } from './TaskList';
import { EllipsisVertical, Pencil, Trash2, Clock, List, Target, Goal, BookOpen, SquareCheckBig, CircleCheckBig } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const [showTasks, setShowTasks] = React.useState(true);
  const editTimeInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setNameInput(goal?.name || 'Focus Goal');
  }, [goal?.name]);

  React.useEffect(() => {
    if (isEditingName && inputRef.current) {
      // Use requestAnimationFrame to ensure the input is focused and selection is set after rendering and dropdown closure
      requestAnimationFrame(() => {
        inputRef.current.focus();
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      });
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

  React.useLayoutEffect(() => {
    if (isEditTimeDialogOpen && editTimeInputRef.current) {
      // Focus and move cursor to end
      const input = editTimeInputRef.current;
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
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
  
  // Format remaining time based on component format
  function formatHoursMinutes(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    // If we have both hours and minutes, use short format (2h 35m left)
    if (h > 0 && m > 0) {
      return `${h}h ${m}m left`;
    }
    // If we only have hours
    if (h > 0) {
      return `${h} ${h === 1 ? 'hour' : 'hours'} remaining`;
    }
    // If we only have minutes or no time
    return m > 0 ? `${m} ${m === 1 ? 'minute' : 'minutes'} left` : '0 minutes left';
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
        <div className="flex items-center gap-2">
        <Target size={22} className="text-pomo-primary flex-shrink-0 mr-0.5" />
          
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
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                setIsEditingName(true);
              }}
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
                onClick={(e) => e.stopPropagation()} // Prevent click from affecting other elements
              >
                <EllipsisVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                className={cn(
                  'cursor-pointer flex items-center',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors'
                )}
                onSelect={() => {
                  setTimeout(() => setIsEditingName(true), 200); // Delay to let the dropdown close
                }}
              >
                <Pencil size={16} className="mr-2" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={cn(
                  'cursor-pointer flex items-center',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors'
                )}
                onSelect={() => setIsEditTimeDialogOpen(true)} // Fixed: now opens edit time dialog correctly
              >
                <Clock size={16} className="mr-2" />
                <span>Edit Time</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={cn(
                  'cursor-pointer flex items-center',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors'
                )}
                onSelect={() => setShowTasks(v => !v)}
              >
                <List size={16} className="mr-2" />
                <span>{showTasks ? 'Hide Tasks' : 'Show Tasks'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={cn(
                  'cursor-pointer flex items-center',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors'
                )}
                onSelect={() => {
                  if (goal) {
                    // Ensure tasks array exists, default to empty if not
                    const tasksToComplete = goal.tasks || []; 
                    const updatedTasks = tasksToComplete.map(task => ({ ...task, isCompleted: true }));
                    
                    setGoal({ 
                      ...goal, 
                      currentHours: goal.targetHours, // Fill remaining time
                      tasks: updatedTasks,            // Mark all tasks as completed
                      isCompleted: true               // Explicitly mark goal as completed
                    });
                  }
                }}
              >
                <CircleCheckBig size={16} className="mr-2" />
                <span>Mark Completed</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={cn(
                  "text-destructive bg-transparent cursor-pointer transition-colors flex items-center",
                  "focus:bg-destructive/90 focus:text-white",
                  "hover:bg-destructive/90 hover:text-white"
                )}
                onSelect={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 size={16} className="mr-2" />
                <span>Delete</span>
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
              {formatHoursMinutes(hoursLeft)}
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
        {showTasks && <TaskList />}
      </div>
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent
          className={cn(
            "rounded-2xl p-6 border transition-all duration-300 ease-in-out",
            isDark
              ? "bg-pomo-background border-pomo-muted/30 shadow-lg shadow-black/30 text-white"
              : "bg-pomo-background border-pomo-muted/30"
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold leading-none tracking-tight">Delete Focus Goal?</DialogTitle>
            <DialogDescription className={cn("text-sm", isDark ? "text-pomo-secondary" : "text-pomo-secondary")}>
              Are you sure you want to delete your current focus goal? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex gap-2">
            <Button variant="outline" className={cn('border-pomo-muted', "rounded-lg px-4 py-2")} onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-lg px-4 py-2"
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
        <DialogContent
          className={cn(
            "rounded-2xl p-6 border transition-all duration-300 ease-in-out",
            isDark
              ? "bg-pomo-background border-pomo-muted/30 shadow-lg shadow-black/30 text-white"
              : "bg-pomo-background border-pomo-muted/30"
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold leading-none tracking-tight">Edit Goal Time</DialogTitle>
            <DialogDescription className={cn("text-sm", isDark ? "text-pomo-secondary" : "text-pomo-secondary")}>
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
              ref={editTimeInputRef}
              type="number"
              min="0.5"
              step="0.5"
              value={editTimeInput}
              onChange={e => setEditTimeInput(e.target.value)}
              placeholder="Enter target hours (e.g., 2.5)"
              className={cn(
                'w-full border rounded px-3 py-2',
                'appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                isDark ? 'bg-pomo-muted/50 text-white' : 'bg-pomo-muted/30 text-[#09090b]'
              )}
              style={{ MozAppearance: 'textfield' }}
            />
          </div>
          <DialogFooter className="mt-2 flex gap-2">
            <Button variant="outline" className={cn('border-pomo-muted', "rounded-lg px-4 py-2")} onClick={() => setIsEditTimeDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleEditTimeSave}
              className="rounded-lg px-4 py-2"
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