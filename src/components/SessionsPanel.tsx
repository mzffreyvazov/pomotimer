/* File: d:\Downloads\code\code\Extra-Projects\mellow-timer-glow\src\components\SessionsPanel.tsx */

import React, { useState, useEffect } from 'react';
import { useTimer, Session, GOAL_COMPLETED_EVENT } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Clock, ListChecks } from "lucide-react";
import { cn } from '@/lib/utils';
import { GoalCard } from './GoalCard';
import { toast } from '@/components/ui/sonner'; // Use toast from sonner.tsx

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
  const { user } = useAuth();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [newGoalHours, setNewGoalHours] = useState<string>('');
  const [newGoalName, setNewGoalName] = useState<string>('');
  const [localSessions, setLocalSessions] = useState<Session[]>(sessions || []);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [hasShownAuthToast, setHasShownAuthToast] = useState(false);
  
  useEffect(() => {
    setLocalSessions(sessions || []);
  }, [sessions]);
  
  useEffect(() => {
    refreshSessions();
    const handleGoalCompleted = () => { setTimeout(() => { refreshSessions(); }, 500); };
    window.addEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted);
    return () => { window.removeEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted); };
  }, [refreshSessions]);
  
  const handleShowSignup = () => {
    window.dispatchEvent(new CustomEvent('SHOW_SIGNUP_MODAL'));
  };
  
  const handleShowLogin = () => {
    window.dispatchEvent(new CustomEvent('SHOW_LOGIN_MODAL'));
  };
  
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
      toast("Goal created", { description: `Set a new focus goal for ${newHours} hours` });
    }
  };
  

  const handleClearSessions = () => {
    clearSessions();
    setLocalSessions([]);
    setIsDeleteDialogOpen(false);
    toast("Sessions cleared", { description: "All session history has been cleared" });
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    setLocalSessions(prev => prev.filter(s => s.id !== sessionId));
    toast("Session deleted", { description: "Session has been removed." });
    setSessionToDelete(null);
  };

  return (
    <div className={cn(
      "p-6 animate-scale-in w-full max-w-[900px] rounded-2xl border transition-all duration-300 ease-in-out",
      isDark 
        ? "bg-pomo-background border-pomo-muted/30 shadow-lg shadow-black/30 text-white" 
        : "bg-pomo-background border-pomo-muted/30 shadow-lg shadow-gray-300/50"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-semibold leading-none tracking-tight">Sessions</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="hover:bg-pomo-muted/40 transition-colors duration-300"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back</span>
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
              <Clock className="w-6 h-6 mx-auto text-pomo-secondary mb-2" /> {/* Added Clock icon */}
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
                Set Your Goal
              </Button>
            </div>
          )}
        </div>

        {/* Recent Sessions Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              Recent Sessions
            </h3>

          </div>
          <div className="flex flex-col gap-4">
            {localSessions.length === 0 ? (
              <div className={cn(
                "p-4 text-center rounded-lg",
                isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
              )}>
                <ListChecks className="w-6 h-6 mx-auto text-pomo-secondary mb-2" /> {/* Added ListChecks icon */}
                <p className="text-sm text-pomo-secondary">
                  No sessions recorded yet.
                </p>
              </div>
            ) : (
              localSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "group flex items-center justify-between w-full rounded-lg px-4 py-3 transition-all duration-300 hover:translate-y-[-2px]",
                    isDark 
                      ? "bg-pomo-muted/50 hover:bg-pomo-muted/60 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                      : "bg-pomo-muted/30 hover:bg-pomo-muted/40 hover:shadow-md"
                  )}
                  style={{ minHeight: 72 }}
                >
                  {/* Left: Session Info */}
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="font-medium text-[15px] truncate">
                      {session.goalName || 'Focus Session'}
                    </span>
                    <div className="flex flex-row items-center mt-1 text-xs text-pomo-secondary gap-x-4">
                      <div className="flex items-center gap-x-1">
                        <Clock className="w-4 h-4 opacity-70" />
                        <span>{formatDuration(session.totalWorkTime)}</span>
                      </div>
                      <div className="flex items-center gap-x-1">
                        <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        <span>{formatDate(session.date)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Right: Action Buttons */}
                  <div className={cn(
                    "flex flex-row gap-2 ml-4",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                    "pointer-events-none group-hover:pointer-events-auto"
                  )}>
                    <button
                      className={cn(
                        "h-8 w-8 flex items-center justify-center rounded-[10px] hover:bg-red-500/20 transition-colors",
                        isDark ? "text-red-300" : "text-red-500"
                      )}
                      aria-label="Delete session"
                      onClick={() => setSessionToDelete(session.id)}
                      type="button"
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
            <Button variant="outline" className='border-pomo-muted' onClick={() => setIsGoalDialogOpen(false)}>Cancel</Button>
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
      
      {/* <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
      </Dialog> */}

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
            <Button variant="outline" className='border-pomo-muted' onClick={() => setSessionToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => sessionToDelete && handleDeleteSession(sessionToDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionsPanel;