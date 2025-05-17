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
  const [isAfterCompletion, setIsAfterCompletion] = useState(false);
  const [localSessions, setLocalSessions] = useState<Session[]>(sessions || []);
  
  // Ref to track the startDate of the processed goal to prevent double processing
  const processedGoalStartDateRef = useRef<Date | null | undefined>(undefined);

  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    focusDuration: 25,
    breakDuration: 5,
    cyclesCompleted: 4,
    totalWorkTime: 100 // in minutes
  });
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Sync local sessions state with the context
  useEffect(() => {
    setLocalSessions(sessions || []);
  }, [sessions]);
  
  // Load sessions on mount
  useEffect(() => {
    refreshSessions();
    
    const handleGoalCompleted = () => {
      setTimeout(() => {
        refreshSessions();
      }, 500);
    };
    
    window.addEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted);
    
    return () => {
      window.removeEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted);
    };
  }, [refreshSessions]);
  
  // Format date to a readable string
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Format minutes to hours and minutes
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  };
  
  // Handle setting a new goal
  const handleSetGoal = () => {
    const newHours = parseFloat(newGoalHours);
    if (!isNaN(newHours) && newHours > 0) {
      setGoal({
        targetHours: newHours,
        currentHours: 0,
        startDate: new Date(),
        isCompleted: false,
        tasks: []
      });
      setIsGoalDialogOpen(false);
      toast({
        title: "Goal created",
        description: `Set a new focus goal for ${newHours} hours`
      });
    }
  };
  
  // Handle clearing a goal
  const handleClearGoal = () => {
    clearGoal();
    toast({
      title: "Goal cleared",
      description: "Your focus goal has been removed"
    });
  };
  
  // Handle manual session addition
  const handleAddSession = () => {
    addSession(newSession);
    setIsAddSessionDialogOpen(false);
    toast({
      title: "Session added",
      description: `Added ${formatDuration(newSession.totalWorkTime)} of focus time`
    });
  };
  
  // Handle clearing all sessions
  const handleClearSessions = () => {
    clearSessions();
    setLocalSessions([]);
    
    setIsDeleteDialogOpen(false);
    toast({
      title: "Sessions cleared",
      description: "All session history has been cleared"
    });
  };
  
  return (
    <div className={cn(
      "sessions-panel p-6 space-y-6",
      isDark ? "bg-[#221F26] text-white" : "bg-pomo-background text-[#221F26]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Sessions</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
            <ArrowLeft className="mr-1" size={16} />
            <span>Back</span>
          </Button>
        )}
      </div>
      
      {/* Goal Card */}
      <div className="mb-6">
        {goal ? (
          <GoalCard 
            onEditClick={() => setIsGoalDialogOpen(true)}
            onClearClick={() => handleClearGoal()}
          />
        ) : (
          <div className={cn(
            "flex flex-col items-center justify-center p-8 rounded-lg border border-dashed text-center space-y-3",
            isDark ? "border-pomo-muted/50 bg-pomo-muted/20 text-white/80" : "border-muted bg-muted/20 text-muted-foreground"
          )}>
            <p>No focus goal set yet</p>
            <Button 
              size="sm"
              onClick={() => setIsGoalDialogOpen(true)}
              className={cn(
                isDark ? "bg-pomo-primary/80 text-white hover:bg-pomo-primary" : "bg-pomo-primary text-white hover:bg-pomo-primary/90"
              )}
            >
              <Plus size={16} className="mr-1" />
              Set Focus Goal
            </Button>
          </div>
        )}
      </div>
      
      {/* Recent Sessions */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Recent Sessions</h3>
          {localSessions.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className={cn(
                "text-muted-foreground"
              )}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          {localSessions.length === 0 ? (
            <div className={cn(
              "p-4 text-center rounded-lg",
              isDark ? "bg-pomo-muted/20 text-white/70" : "bg-muted/20 text-muted-foreground"
            )}>
              <p className="text-sm">No sessions recorded yet.</p>
              <p className="text-xs mt-1">Complete a timer session or add one manually.</p>
            </div>
          ) : (
            localSessions.slice(0, 5).map((session) => (
              <div 
                key={session.id} 
                className={cn(
                  "p-3 rounded-lg",
                  isDark ? "bg-pomo-muted/20" : "bg-muted/10"
                )}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <span className={cn(
                        "font-medium",
                        isDark ? "text-white" : "text-foreground"
                      )}>
                        {formatDate(session.date)}
                      </span>
                      {session.cyclesCompleted >= 4 && (
                        <span className={cn(
                          "ml-2 text-xs px-2 py-0.5 rounded-full",
                          isDark 
                            ? "bg-pomo-primary/20 text-pomo-primary" 
                            : "bg-pomo-primary/10 text-pomo-primary"
                        )}>
                          Goal Progress
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm mt-1">
                      <Clock className={cn(
                        "w-3 h-3 mr-1",
                        isDark ? "text-white/70" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        isDark ? "text-white/70" : "text-muted-foreground"
                      )}>
                        {formatDuration(session.totalWorkTime)}
                      </span>
                    </div>
                  </div>
                  <span className={cn(
                    "text-lg font-medium",
                    isDark ? "text-green-400" : "text-green-600"
                  )}>
                    +{(session.totalWorkTime / 60).toFixed(1)}h
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Add session button */}
        <div className="flex justify-center mt-4">
          <Button 
            onClick={() => setIsAddSessionDialogOpen(true)}
            className={cn(
              "w-full",
              isDark 
                ? "bg-pomo-primary/90 text-white hover:bg-pomo-primary" 
                : "bg-pomo-primary text-white hover:bg-pomo-primary/90"
            )}
          >
            <Plus size={16} className="mr-1" />
            Add Session
          </Button>
        </div>
      </div>
      
      {/* Goal Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Focus Goal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Hours</label>
                <Input 
                  type="number" 
                  min="0.5" 
                  step="0.5" 
                  value={newGoalHours} 
                  onChange={(e) => setNewGoalHours(e.target.value)}
                  className={cn(
                    isDark ? "bg-[#181518]/80 border-pomo-muted/50 text-white" : "border-input"
                  )}
                />
                <p className={cn(
                  "text-xs",
                  isDark ? "text-white/70" : "text-muted-foreground"
                )}>
                  Enter how many total hours you want to focus
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSetGoal}
              className={cn(
                isDark ? "bg-pomo-primary/80 text-white hover:bg-pomo-primary" : "bg-pomo-primary text-white hover:bg-pomo-primary/90"
              )}
            >
              Set Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Session Dialog */}
      <Dialog open={isAddSessionDialogOpen} onOpenChange={setIsAddSessionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Session Manually</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Focus Time (minutes)</label>
                <Input 
                  type="number" 
                  value={newSession.totalWorkTime}
                  onChange={(e) => setNewSession({...newSession, totalWorkTime: parseInt(e.target.value) || 0})}
                  className={cn(
                    isDark ? "bg-[#181518]/80 border-pomo-muted/50 text-white" : "border-input"
                  )}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSessionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSession}>Add Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Session History</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to clear all session history? This action cannot be undone.</p>
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