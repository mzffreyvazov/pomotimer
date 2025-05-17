import React, { useState } from 'react';
import { useTimer, Task } from '@/contexts/TimerContext';
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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

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
    <div className={cn(
      "space-y-2 p-3 rounded-lg",
      isDark ? "bg-pomo-muted/20" : "bg-muted/30"
    )}>
      <div className="flex justify-between items-center mb-2">
        <h3 className={cn(
          "text-sm font-medium",
          isDark ? "text-white" : "text-foreground"
        )}>Tasks</h3>
        <span className={cn(
          "text-xs",
          isDark ? "text-white/70" : "text-muted-foreground"
        )}>
          {goal.tasks.filter(task => task.isCompleted).length}/{goal.tasks.length} completed
        </span>
      </div>

      <div className={cn(
        "flex items-center rounded-lg mb-2",
        isDark ? "bg-[#181518]/80" : "bg-background"
      )}>
        <Input
          type="text"
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 border-0 h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0",
            isDark ? "bg-transparent text-white placeholder:text-white/50" : "bg-transparent text-[#221F26] placeholder:text-muted-foreground"
          )}
        />
        <Button 
          size="sm" 
          variant="ghost"
          onClick={handleAddTask}
          className={cn(
            "h-6 w-6 p-1 rounded-md mr-1",
            isDark 
              ? "bg-pomo-primary text-white hover:bg-pomo-primary/80" 
              : "bg-pomo-primary text-white hover:bg-pomo-primary/80"
          )}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {goal.tasks.length === 0 ? (
          <p className={cn(
            "text-xs text-center py-4",
            isDark ? "text-white/70" : "text-muted-foreground"
          )}>
            No tasks added yet. Add your first task above.
          </p>
        ) : (
          goal.tasks.map((task) => (
            <div 
              key={task.id}
              className={cn(
                "flex items-center px-2 py-1 rounded-md",
                task.isCompleted 
                  ? isDark 
                    ? "text-green-400" 
                    : "text-green-600"
                  : isDark 
                    ? "text-white" 
                    : "text-foreground"
              )}
            >
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => toggleTaskCompletion(task.id)}
                  className="rounded border-muted"
                />
                <span className={cn(
                  "text-sm",
                  task.isCompleted && "line-through opacity-70"
                )}>
                  {task.title}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteTask(task.id)}
                className={cn(
                  "h-6 w-6 p-0 opacity-60 hover:opacity-100",
                  isDark ? "text-white/70 hover:bg-transparent" : "text-muted-foreground hover:bg-transparent"
                )}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}