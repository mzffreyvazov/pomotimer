/* File: d:\Downloads\code\code\Extra-Projects\mellow-timer-glow\src\components\TaskList.tsx */

import React, { useState } from 'react';
import { useTimer, Task } from '@/contexts/TimerContext'; // Ensure Task is correctly exported from TimerContext
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TaskList() {
  const { goal, addTask, toggleTaskCompletion, deleteTask } = useTimer();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [newTaskTitle, setNewTaskTitle] = useState('');

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
      <div className="flex justify-between items-center">
        <h3 className={cn(
          "text-sm font-medium",
          isDark ? "text-white/90" : "text-gray-800"
        )}>
          Tasks
        </h3>
        <span className={cn(
          "text-xs",
          isDark ? "text-white/60" : "text-gray-500"
        )}>
          {goal.tasks.filter(task => task.isCompleted).length}/{goal.tasks.length} completed
        </span>
      </div>

      <div className={cn(
        "flex items-center rounded-md",
        isDark ? "bg-pomo-muted/20" : "bg-gray-50"
      )}>
        <Input
          type="text"
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 border-0 h-9 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent",
            isDark 
              ? "text-white placeholder:text-white/50" 
              : "text-gray-900 placeholder:text-gray-500"
          )}
        />
        <Button 
          size="sm" 
          variant="ghost"
          onClick={handleAddTask}
          className={cn(
            "h-7 w-7 p-0 rounded-sm m-1",
            "bg-pomo-primary text-white hover:bg-pomo-primary/90"
          )}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
        {goal.tasks.length === 0 ? (
          <div className={cn(
            "py-2 text-center text-xs",
            isDark ? "text-white/50" : "text-gray-500"
          )}>
            No tasks added yet
          </div>
        ) : (
          goal.tasks.map((task: Task) => (
            <div 
              key={task.id}
              className={cn(
                "flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
                isDark 
                  ? "hover:bg-pomo-muted/20" 
                  : "hover:bg-gray-50",
                task.isCompleted && (
                  isDark 
                    ? "text-green-400/80" 
                    : "text-green-600"
                )
              )}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => toggleTaskCompletion(task.id)}
                  className={cn(
                    "rounded border-2 focus:ring-offset-0 focus:ring-1 focus:ring-pomo-primary",
                    isDark 
                      ? "bg-transparent border-white/20 checked:bg-pomo-primary checked:border-pomo-primary" 
                      : "border-gray-300 checked:bg-pomo-primary checked:border-pomo-primary"
                  )}
                />
                <span className={cn(
                  task.isCompleted && "line-through opacity-70"
                )}>
                  {task.title}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteTask(task.id)}
                className={cn(
                  "h-6 w-6 p-0 opacity-50 hover:opacity-100 transition-opacity",
                  isDark 
                    ? "text-white/60 hover:text-white/90 hover:bg-white/10" 
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                )}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}