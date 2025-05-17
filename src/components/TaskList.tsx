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
          "text-base font-medium text-[#09090b]",
          isDark && "text-white"
        )}>
          Tasks
        </h3>
        <span className={cn(
          "text-sm text-gray-500",
          isDark && "text-white/60"
        )}>
          {goal.tasks.filter(task => task.isCompleted).length}/{goal.tasks.length} completed
        </span>
      </div>

      <div className={cn(
        "flex items-center rounded-xl overflow-hidden",
        isDark 
          ? "bg-white/5 border border-white/10" 
          : "bg-white border border-gray-200"
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
              : "text-[#09090b] placeholder:text-gray-500"
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

      <div className="space-y-1 max-h-[180px] overflow-y-auto">
        {goal.tasks.length === 0 ? (
          <div></div>
        ) : (
          goal.tasks.map((task: Task) => (
            <div 
              key={task.id}
              className={cn(
                "flex items-center justify-between py-1.5 text-sm",
                isDark 
                  ? "text-white" 
                  : "text-[#09090b]"
              )}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => toggleTaskCompletion(task.id)}
                  className={cn(
                    "rounded border-2 focus:ring-offset-0 focus:ring-1 focus:ring-[#6528F7]",
                    isDark 
                      ? "bg-transparent border-white/20 checked:bg-[#6528F7] checked:border-[#6528F7]" 
                      : "border-gray-200 checked:bg-[#6528F7] checked:border-[#6528F7]"
                  )}
                />
                <span className={cn(
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
                  "h-6 w-6 p-0 opacity-40 hover:opacity-100",
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
  );
}