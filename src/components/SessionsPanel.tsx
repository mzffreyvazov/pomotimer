/* File: d:\Downloads\code\code\Extra-Projects\mellow-timer-glow\src\components\SessionsPanel.tsx */

import React, { useState, useEffect, useRef } from 'react';
import { useTimer, Session, GOAL_COMPLETED_EVENT } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    addSession,
    goal,
    setGoal,
    clearGoal,
    refreshSessions
  } = useTimer();
  const { theme } = useTheme();
  const { toast } = useToast();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [newGoalHours, setNewGoalHours] = useState<string>(goal?.targetHours?.toString() || '6');
  const [localSessions, setLocalSessions] = useState<Session[]>(sessions || []);
  
  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false);
  const [newSessionState, setNewSessionState] = useState({ // Renamed to avoid conflict
    focusDuration: 25,
    breakDuration: 5,
    cyclesCompleted: 4,
    totalWorkTime: 100 
  });
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  useEffect(() => {
    setLocalSessions(sessions || []);
  }, [sessions]);
  
  useEffect(() => {
    refreshSessions();
    const handleGoalCompleted = () => { setTimeout(() => { refreshSessions(); }, 500); };
    window.addEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted);
    return () => { window.removeEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted); };
  }, [refreshSessions]);
  
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
    if (!isNaN(newHours) && newHours > 0) {
      setGoal({ targetHours: newHours, currentHours: 0, startDate: new Date(), isCompleted: false, tasks: [] });
      setIsGoalDialogOpen(false);
      toast({ title: "Goal created", description: `Set a new focus goal for ${newHours} hours` });
    }
  };
  
  const handleAddSession = () => {
    addSession(newSessionState); // Use renamed state
    setIsAddSessionDialogOpen(false);
    toast({ title: "Session added", description: `Added ${formatDuration(newSessionState.totalWorkTime)} of focus time` });
  };
  
  const handleClearSessions = () => {
    clearSessions();
    setLocalSessions([]);
    setIsDeleteDialogOpen(false);
    toast({ title: "Sessions cleared", description: "All session history has been cleared" });
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
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddSessionDialogOpen(true)}
                className={cn(
                  "h-8 border-pomo-muted",
                  isDark 
                    ? "hover:bg-pomo-muted/30 text-pomo-secondary" 
                    : "hover:bg-pomo-muted/20 text-pomo-secondary"
                )}
              >
                <Plus size={16} className="mr-1" />
                Add
              </Button>
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
              )}>
                <p className="text-sm text-pomo-secondary">
                  No sessions recorded yet.
                </p>
                <p className="text-xs mt-1 text-pomo-secondary">
                  Complete a timer session or add one manually.
                </p>
              </div>
            ) : (
              localSessions.slice(0, 5).map((session) => (
                <div 
                  key={session.id} 
                  className={cn(
                    "p-3 rounded-lg transition-colors",
                    isDark 
                      ? "bg-pomo-muted/50 hover:bg-pomo-muted/60" 
                      : "bg-pomo-muted/30 hover:bg-pomo-muted/40"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <div>
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
                    <span className={cn(
                      "text-sm font-medium",
                      isDark ? "text-pomo-primary" : "text-pomo-primary"
                    )}>
                      +{(session.totalWorkTime / 60).toFixed(1)}h
                    </span>
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
          </DialogHeader>
          <div className="py-4">
            <Input 
              type="number" 
              min="0.5" 
              step="0.5" 
              value={newGoalHours} 
              onChange={(e) => setNewGoalHours(e.target.value)}
              className={cn(
                "border-pomo-muted focus-visible:ring-pomo-primary",
                isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
              )}
            />
            <p className="text-xs mt-1.5 text-pomo-secondary">
              Total hours you want to focus.
            </p>
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
      
      <Dialog open={isAddSessionDialogOpen} onOpenChange={setIsAddSessionDialogOpen}>
        <DialogContent className={cn(isDark ? "dark-dialog-theme" : "")}>
          <DialogHeader>
            <DialogTitle>Add Session Manually</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className={cn(
              "text-sm font-medium mb-1.5 block",
              isDark ? "text-white" : "text-[#09090b]"
            )}>
              Focus Time (minutes)
            </label>
            <Input 
              type="number" 
              value={newSessionState.totalWorkTime}
              onChange={(e) => setNewSessionState({...newSessionState, totalWorkTime: parseInt(e.target.value) || 0})}
              className={cn(
                isDark 
                  ? "bg-white/5 border-white/20 text-white" 
                  : "border-gray-200"
              )}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSessionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSession} className="bg-[#6528F7] text-white hover:bg-[#6528F7]/90">
              Add Session
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
    </div>
  );
};

export default SessionsPanel;