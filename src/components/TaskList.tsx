/* File: d:\Downloads\code\code\Extra-Projects\mellow-timer-glow\src\components\TaskList.tsx */

import React, { useState } from 'react';
import { useTimer, Task } from '@/contexts/TimerContext'; // Ensure Task is correctly exported from TimerContext
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox component
import { Plus, X, ChevronDown, ChevronRight, SquareCheckBig, CircleCheck, ListTodo  } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TaskList() {
  const { goal, addTask, toggleTaskCompletion, deleteTask } = useTimer();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [open, setOpen] = useState(false);

  // Add effect to collapse tasks when goal changes
  React.useEffect(() => {
    if (goal) {
      setOpen(false);
    }
  }, [goal?.startDate]); // Use startDate as dependency to detect new goals

  if (!goal) {
    return null;
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle);
      setNewTaskTitle('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newTaskTitle.trim()) {
        addTask(newTaskTitle);
        setNewTaskTitle('');
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center select-none mb-2">
        <button
          type="button"
          aria-label={open ? 'Collapse tasks' : 'Expand tasks'}
          onClick={() => setOpen(o => !o)}
          className={cn(
            'flex items-center px-1 py-0.5 rounded transition-colors',
            isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200')}
          style={{ gap: '8px' }} // Adjusted gap for icon
        >
          <ListTodo  className={cn('w-4 h-4 text-pomo-primary')} /> 
          <h3 className={cn(
            "text-base font-medium text-[#09090b]",
            isDark && "text-white"
          )}>
            Tasks
          </h3>
          {open ? (
            <ChevronDown className={cn('w-4 h-4', isDark ? 'text-white' : 'text-[#09090b]')} />
          ) : (
            <ChevronRight className={cn('w-4 h-4', isDark ? 'text-white' : 'text-[#09090b]')} />
          )}
        </button>
        <span className={cn(
          "text-sm text-gray-500",
          isDark && "text-white/60"
        )}>
          {goal.tasks.filter(task => task.isCompleted).length}/{goal.tasks.length} completed
        </span>
      </div>

      {/* Collapsible content */}
      <div
        style={{
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s cubic-bezier(0.4,0,0.2,1)',
          maxHeight: open ? 500 : 0,
          opacity: open ? 1 : 0,
        }}
      >
        <div className={cn(
          "flex items-center rounded-xl overflow-hidden",
          isDark 
            ? "bg-white/5 border border-white/10" 
            : "border border-gray-300"  // Changed: stronger border in light mode
        )}>
          <Input
            type="text"
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex-1 border-0 h-11 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-4",
              isDark 
                ? "text-white placeholder:text-white/40" 
                : "text-[#09090b] placeholder:text-gray-400"
            )}
          />
          <Button 
            size="sm" 
            onClick={handleAddTask}
            className = "text-sh h-11 px-4 rounded-l-none " 
          >
            <Plus className="h-5 w-5 text-primary-foreground" />
          </Button>
        </div>
        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 mt-2">
          {goal.tasks.length === 0 ? (
            null
          ) : (
            goal.tasks.map((task: Task) => (
              <div 
                key={task.id}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200",
                  isDark 
                    ? "text-white hover:bg-white/5 border border-white/10" 
                    : "text-[#09090b] hover:bg-gray-50/50 border border-gray-300", // Changed: stronger border, lighter hover
                  task.isCompleted && isDark && "bg-white/5 border-white/5",
                  task.isCompleted && !isDark && "bg-gray-50/30 border-gray-200" // Changed: lighter background
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative flex items-center justify-center">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.isCompleted}
                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                      className={cn(
                        "h-5 w-5 rounded-[5px] border-2 transition-all duration-200",
                        isDark 
                          ? "border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                          : "border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      )}
                    />
                  </div>
                  <span className={cn(
                    "text-sm truncate flex-1",
                    task.isCompleted && "line-through opacity-60"
                  )}>
                    {task.title}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteTask(task.id)}
                  className={cn(
                    "h-6 w-6 p-0 opacity-40 hover:opacity-100 ml-2 flex-shrink-0",
                    isDark 
                      ? "text-white hover:bg-white/10" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}