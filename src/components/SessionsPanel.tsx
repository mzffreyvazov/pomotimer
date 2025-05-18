/* File: d:\Downloads\code\code\Extra-Projects\mellow-timer-glow\src\components\SessionsPanel.tsx */

import React, { useState, useEffect } from 'react';
import { useTimer, Session, GOAL_COMPLETED_EVENT } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Trash2, Clock, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { GoalCard } from './GoalCard';

interface SessionsPanelProps {
  onClose?: () => void;
}

const SessionsPanel: React.FC<SessionsPanelProps> = ({ onClose }) => {
  const { 
    sessions, 
    clearSessions, 
    goal,
    setGoal,
    clearGoal,
    refreshSessions,
    deleteSession
  } = useTimer();
  const { theme } = useTheme();
  const { toast } = useToast();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [newGoalHours, setNewGoalHours] = useState<string>('');
  const [newGoalName, setNewGoalName] = useState<string>('');
  const [localSessions, setLocalSessions] = useState<Session[]>(sessions || []);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    setLocalSessions(sessions || []);
  }, [sessions]);
  
  useEffect(() => {
    refreshSessions();
    const handleGoalCompleted = () => { setTimeout(() => { refreshSessions(); }, 500); };
    window.addEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted);
    return () => { window.removeEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted); };
  }, [refreshSessions]);
  
  useEffect(() => {
    if (isGoalDialogOpen) {
      // Clear inputs when dialog opens
      setNewGoalName('');
      setNewGoalHours('');
    }
  }, [isGoalDialogOpen]);
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };
  
  const handleSetGoal = () => {
    const newHours = parseFloat(newGoalHours);
    const name = newGoalName.trim() || 'Focus Goal';
    if (!isNaN(newHours) && newHours > 0) {
      setGoal({ targetHours: newHours, currentHours: 0, startDate: new Date(), isCompleted: false, tasks: [], name });
      setIsGoalDialogOpen(false);
      toast({ title: "Goal created", description: `Set a new focus goal for ${newHours} hours` });
    }
  };

  const handleClearSessions = () => {
    clearSessions();
    setLocalSessions([]);
    setIsDeleteDialogOpen(false);
    toast({ title: "Sessions cleared", description: "All session history has been cleared" });
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    setLocalSessions(prev => prev.filter(s => s.id !== sessionId));
    toast({ title: 'Session deleted', description: 'Session has been removed.' });
    setSessionToDelete(null);
  };

  return (
    <div className={cn(
      "settings-panel p-6 animate-scale-in w-full max-w-[900px]",
      isDark && "text-white"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold">Sessions</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft size={18} />
          <span className="ml-1">Back</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Focus Goal Section */}
        <div>
          {goal ? (
            <GoalCard />
          ) : (
            <div className={cn(
              "p-6 rounded-lg text-center space-y-3",
              isDark 
                ? "bg-pomo-muted/50" 
                : "bg-pomo-muted/30"
            )}>
              <p className={cn(
                "text-sm",
                isDark ? "text-pomo-secondary" : "text-pomo-secondary"
              )}>
                No focus goal set yet.
              </p>
              <Button 
                size="sm"
                onClick={() => setIsGoalDialogOpen(true)}
                className={cn(
                  "text-white",
                  isDark 
                    ? "bg-pomo-primary/80 hover:bg-pomo-primary text-pomo-background" 
                    : "bg-pomo-primary hover:bg-pomo-primary/90"
                )}
              >
                <Plus size={16} className="mr-1" />
                Set Focus Goal
              </Button>
            </div>
          )}
        </div>

        {/* Recent Sessions Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-medium">
              Recent Sessions
            </h3>            <div className="flex items-center gap-2">
              {localSessions.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className={cn(
                    "h-8 w-8",
                    isDark 
                      ? "text-pomo-secondary hover:text-red-400 hover:bg-red-500/20" 
                      : "text-pomo-secondary hover:text-red-600 hover:bg-red-50"
                  )}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            {localSessions.length === 0 ? (
              <div className={cn(
                "p-4 text-center rounded-lg",
                isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
              )}>                <p className="text-sm text-pomo-secondary">
                  No sessions recorded yet.
                </p>
                <p className="text-xs mt-1 text-pomo-secondary">
                  Complete a timer session to track your progress.
                </p>
              </div>
            ) : (
              localSessions.slice(0, 5).map((session) => (
                <div 
                  key={session.id} 
                  className={cn(
                    "p-3 rounded-lg transition-colors group flex items-center justify-between overflow-hidden relative",
                    isDark 
                      ? "bg-pomo-muted/50 hover:bg-pomo-muted/60" 
                      : "bg-pomo-muted/30 hover:bg-pomo-muted/40"
                  )}
                  style={{ minHeight: 56 }}
                >
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {formatDate(session.date)}
                      </span>
                      {session.cyclesCompleted >= 4 && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          isDark
                            ? "bg-pomo-primary/20 text-pomo-primary"
                            : "bg-pomo-primary/30 text-pomo-primary"
                        )}>
                          Goal Achieved
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs mt-1 text-pomo-secondary">
                      <Clock className="w-3.5 h-3.5 mr-1 opacity-70" />
                      <span>{formatDuration(session.totalWorkTime)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative" style={{ minWidth: 70, justifyContent: 'flex-end' }}>
                    <span
                      className={cn(
                        "time-counter block text-sm font-medium transition-transform duration-100 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        "group-hover:translate-x-[-32px]",
                        // No shift by default
                      )}
                      style={{ minWidth: 48, textAlign: 'right' }}
                    >
                      +{(session.totalWorkTime / 60).toFixed(1)}h
                    </span>
                    <button
                      className={cn(
                        "absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10",
                        isDark ? "text-red-300" : "text-red-500"
                      )}
                      aria-label="Delete session"
                      onClick={() => setSessionToDelete(session.id)}
                      tabIndex={0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className={cn(isDark ? "dark-dialog-theme" : "")}>
          <DialogHeader>
            <DialogTitle>Set Focus Goal</DialogTitle>
            <DialogDescription>
              Create a new focus goal with a target duration to track your progress.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label 
                htmlFor="goalName" 
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                  isDark ? "text-white" : "text-gray-700"
                )}
              >
                Goal Name
              </label>
              <Input
                id="goalName"
                type="text"
                placeholder="What are you focusing on?"
                value={newGoalName}
                onChange={e => setNewGoalName(e.target.value)}
                className={cn(
                  "border-pomo-muted focus-visible:ring-pomo-primary",
                  isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
                )}
                maxLength={40}
              />
            </div>
            
            <div className="space-y-2">
              <label 
                htmlFor="goalHours" 
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                  isDark ? "text-white" : "text-gray-700"
                )}
              >
                Target Hours
              </label>
              <Input 
                id="goalHours"
                type="number" 
                min="0.5" 
                step="0.5" 
                value={newGoalHours} 
                onChange={(e) => setNewGoalHours(e.target.value)}
                inputMode="decimal"
                placeholder="How long will you focus?"
                className={cn(
                  "border-pomo-muted focus-visible:ring-pomo-primary appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                  isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
                )}
                style={{ MozAppearance: 'textfield' }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSetGoal} 
              className={cn(
                "text-white",
                isDark 
                  ? "bg-pomo-primary/80 hover:bg-pomo-primary text-pomo-background" 
                  : "bg-pomo-primary hover:bg-pomo-primary/90"
              )}
            >
              Set Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className={cn(isDark ? "dark-dialog-theme" : "")}>
          <DialogHeader>
            <DialogTitle>Clear Session History</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className={isDark ? "text-white/60" : "text-gray-500"}>
              Are you sure you want to clear all session history? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClearSessions}>Clear History</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Individual session delete confirmation dialog */}
      <Dialog open={!!sessionToDelete} onOpenChange={open => { if (!open) setSessionToDelete(null); }}>
        <DialogContent className={cn(isDark ? "dark-dialog-theme" : "")}> 
          <DialogHeader>
            <DialogTitle>Delete Session?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className={isDark ? "text-white/60" : "text-gray-500"}>
              Are you sure you want to delete this session? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => sessionToDelete && handleDeleteSession(sessionToDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionsPanel;