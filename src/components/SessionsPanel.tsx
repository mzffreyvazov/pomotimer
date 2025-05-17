import React, { useState, useEffect, useRef } from 'react';
import { useTimer, Session, GOAL_COMPLETED_EVENT } from '../contexts/TimerContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Settings, Trash2, ArrowLeft, PlusCircle, Clock, CheckCircle, Award } from 'lucide-react';
import { Badge } from './ui/badge';

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
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [newGoalHours, setNewGoalHours] = useState<string>(goal?.targetHours?.toString() || '6');
  const [isAfterCompletion, setIsAfterCompletion] = useState(false);
  const [localSessions, setLocalSessions] = useState<Session[]>(sessions || []);
  
  // Ref to track the startDate of the processed goal to prevent double processing
  const processedGoalStartDateRef = useRef<Date | null | undefined>(undefined); // Initialize to undefined

  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    focusDuration: 25,
    breakDuration: 5,
    cyclesCompleted: 4,
    totalWorkTime: 100 // in minutes
  });
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Sync local sessions state with the context, ensuring it's always an array
  useEffect(() => {
    setLocalSessions(sessions || []);
  }, [sessions]);
  
  // Load sessions on mount and refresh them regularly
  useEffect(() => {
    const loadSessions = () => {
      refreshSessions();
    };
    
    // Initial load
    loadSessions();
    
    // Refresh sessions when the GOAL_COMPLETED_EVENT is triggered
    const handleGoalCompleted = () => {
      // Refresh sessions to make sure the goal completion session appears
      setTimeout(() => {
        refreshSessions();
      }, 500); // Small delay to ensure the session has been added
    };
    
    window.addEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted);
    
    return () => {
      window.removeEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Calculate progress percentage
  const progressPercentage = goal ? Math.min(100, Math.round((goal.currentHours / goal.targetHours) * 100)) : 0;
  
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
        currentHours: goal?.currentHours || 0,
        startDate: new Date(),
        isCompleted: false
      });
      setIsGoalDialogOpen(false);
      toast("Focus goal set", {
        description: `Target: ${newHours} hours`
      });
    }
  };
  
  // Handle manual session addition
  const handleAddSession = () => {
    addSession(newSession);
    setIsAddSessionDialogOpen(false);
    toast("Session added", {
      description: `Added ${formatDuration(newSession.totalWorkTime)} of focus time`
    });
  };
  
  // Handle clearing all sessions
  const handleClearSessions = () => {
    // Clear through the context
    clearSessions();
    
    // Clear local state for immediate UI update
    setLocalSessions([]);
    
    // Directly remove from localStorage as a safety measure
    try {
      localStorage.removeItem('timerSessions');
    } catch (e) {
      console.error('Failed to remove sessions from localStorage:', e);
    }
    
    setIsDeleteDialogOpen(false);
    toast("Sessions cleared", {
      description: "All session history has been cleared"
    });
  };
  
  // Listen for goal completion event
  useEffect(() => {
    const handleGoalCompleted = () => {
      // Check if goal exists and if its startDate is different from the last processed one
      if (goal && goal.startDate?.getTime() !== processedGoalStartDateRef.current?.getTime()) {
        // 1. Create session data from the completed goal
        const completedGoalSession: Omit<Session, 'id' | 'date'> = {
          focusDuration: goal.targetHours * 60, // Convert hours to minutes
          breakDuration: 0, // No specific break duration for a goal session
          cyclesCompleted: 0, // Goal session is not cycle-based in the same way
          totalWorkTime: goal.targetHours * 60, // Total work is the goal duration
        };

        // 2. Add this session to the history
        // This will update the context's sessions state and localStorage
        addSession(completedGoalSession, false);

        // Mark this goal instance (by its startDate) as processed
        processedGoalStartDateRef.current = goal.startDate;

        // 3. Clear the completed goal to prompt for a new one
        clearGoal();
        
        // 4. UI updates for dialog and toast
        setIsGoalDialogOpen(true);
        setIsAfterCompletion(true);
        
        toast("🎉 Goal Completed!", {
          description: `Target of ${goal.targetHours} hours achieved! Session logged. Set your next goal.`,
          duration: 7000,
        });
      } else if (goal && goal.startDate?.getTime() === processedGoalStartDateRef.current?.getTime()) {
        // If the goal is the same as the one already processed, just ensure the UI is in the correct state
        if (!isGoalDialogOpen) {
            setIsGoalDialogOpen(true);
            setIsAfterCompletion(true);
        }
      }
    };

    window.addEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted);
    return () => {
      window.removeEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted);
    };
  // Ensure all dependencies that could affect the logic or are used inside are listed.
  // Removed refreshSessions from dependencies as the call was removed.
  }, [goal, addSession, clearGoal, setIsGoalDialogOpen, setIsAfterCompletion, isGoalDialogOpen]);

  // Effect to reset the processedGoalStartDateRef when the goal is cleared (becomes null)
  // or when a new goal is set (which would have a new startDate).
  useEffect(() => {
    if (!goal || (goal && goal.startDate !== processedGoalStartDateRef.current)) {
      processedGoalStartDateRef.current = undefined; // Reset to undefined, not null
    }
  }, [goal]);
  
  // Reset isAfterCompletion when dialog closes
  useEffect(() => {
    if (!isGoalDialogOpen) {
      setIsAfterCompletion(false);
    }
  }, [isGoalDialogOpen]);

  return (
    <div className={cn(
      "sessions-panel p-4 space-y-6 min-h-[400px]",
      isDark ? "bg-[#221F26] text-white" : "bg-pomo-background text-[#221F26]"
    )}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold">Sessions</h2>
        <div className="flex gap-2">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className={cn(isDark ? "text-white hover:bg-pomo-muted/30" : "text-[#221F26] hover:bg-pomo-muted/30") }>
              <ArrowLeft size={18} />
              <span className="ml-1">Back</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Goal Progress Section */}
      {goal ? (
        <Card className={cn(
          "p-4 shadow-md transition-all duration-300",
          isDark ? "bg-pomo-muted/30 border border-pomo-muted/50 text-white" : "bg-white border border-pomo-muted/30 text-[#221F26]"
        )}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Focus Goal</h3>
            <div className="flex gap-2">
              <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings size={18} className="mr-1" />
                    <span>Edit</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className={cn(
                  isDark ? "bg-[#221F26] border border-pomo-muted/50 text-white" : "bg-white border border-pomo-muted/30 text-[#221F26]"
                )}>
                  <DialogHeader>
                    <DialogTitle>{isAfterCompletion ? "Set Your Next Focus Goal" : "Set Focus Goal"}</DialogTitle>
                    {isAfterCompletion && (
                      <DialogDescription>
                        Congratulations on completing your previous goal! What would you like to achieve next?
                      </DialogDescription>
                    )}
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="goalHours">Target Hours</Label>
                      <Input 
                        id="goalHours" 
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
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        clearGoal();
                        setIsGoalDialogOpen(false);
                        toast("Goal cleared", {
                          description: "Your focus goal has been removed"
                        });
                      }}
                      className="mr-auto"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Remove Goal
                    </Button>
                    <Button 
                      onClick={handleSetGoal}
                      className={cn(
                        "text-white", 
                        isDark 
                          ? "bg-pomo-primary/80 hover:bg-pomo-primary text-pomo-background" 
                          : "bg-pomo-primary hover:bg-pomo-primary/90"
                      )}
                    >
                      {isAfterCompletion ? "Start New Goal" : "Save Goal"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="mb-1 text-xs text-pomo-secondary flex justify-between">
            <span>{goal.currentHours < 1
              ? `${Math.round(goal.currentHours * 60)} minutes`
              : `${goal.currentHours.toFixed(1)} hours`
            } of {goal.targetHours} hours</span>
            <span>{progressPercentage}%</span>
          </div>
          
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="mt-3 text-xs text-pomo-secondary flex justify-between">
            <span>Started: {formatDate(goal.startDate)}</span>
            <span>{(goal.targetHours - goal.currentHours).toFixed(1)}h remaining</span>
          </div>
        </Card>
      ) : (
        <Card className={cn(
          "p-4 shadow-md transition-all duration-300 flex flex-col items-center text-center",
          isDark ? "bg-pomo-muted/30 border border-pomo-muted/50 text-white" : "bg-white border border-pomo-muted/30 text-[#221F26]"
        )}>
          <h3 className="text-lg font-semibold mb-2">Set a Focus Goal</h3>
          <p className="text-sm text-pomo-secondary mb-4">Track your progress towards a target amount of focus time</p>
          
          <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button>Set Goal</Button>
            </DialogTrigger>
            <DialogContent className={cn(
              isDark ? "bg-[#221F26] border border-pomo-muted/50 text-white" : "bg-white border border-pomo-muted/30 text-[#221F26]"
            )}>
              <DialogHeader>
                <DialogTitle>{isAfterCompletion ? "Set Your Next Focus Goal" : "Set Focus Goal"}</DialogTitle>
                {isAfterCompletion && (
                  <DialogDescription>
                    Congratulations on completing your previous goal! What would you like to achieve next?
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goalHours">Target Hours</Label>
                  <Input 
                    id="goalHours" 
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
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSetGoal}
                  className={cn(
                    "text-white", 
                    isDark 
                      ? "bg-pomo-primary/80 hover:bg-pomo-primary text-pomo-background" 
                      : "bg-pomo-primary hover:bg-pomo-primary/90"
                  )}
                >
                  {isAfterCompletion ? "Start New Goal" : "Save Goal"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      )}
      
      {/* Sessions History */}
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Recent Sessions</h3>
          <div className="flex gap-2">
            {localSessions.length > 0 && (
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-xs border", isDark ? "border-pomo-muted/50 text-white hover:bg-pomo-muted/30" : "border-pomo-muted/30 text-[#221F26] hover:bg-pomo-muted/30") }>
                    <Trash2 size={14} className="mr-1" />
                    Clear
                  </Button>
                </DialogTrigger>
                <DialogContent className={cn(
                  isDark ? "bg-pomo-muted/50" : "bg-white"
                )}>
                  <DialogHeader>
                    <DialogTitle>Clear All Sessions</DialogTitle>
                    <DialogDescription>
                      This will permanently delete all your session history. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 flex-col sm:flex-row sm:justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleClearSessions}
                    >
                      Clear All Sessions
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        {localSessions && localSessions.length > 0 ? (
          <div className="space-y-3">
            {localSessions.map(session => (
              <Card 
                key={session.id} 
                className={cn(
                  "p-3 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border",
                  isDark ? "bg-pomo-muted/20 hover:bg-pomo-muted/30 border-pomo-muted/50 text-white" : "bg-white hover:bg-gray-50 border-pomo-muted/30 text-[#221F26]"
                )}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium flex items-center">
                      {formatDate(session.date)}
                      {/* Special badge for completed goals (no cycles) */}
                      {session.cyclesCompleted === 0 && session.breakDuration === 0 && (
                        <Badge variant="outline" className={cn(
                          "ml-2 text-xs font-normal px-1.5 py-0.5",
                          isDark ? "border-pomo-primary/70 text-pomo-primary/90 bg-pomo-primary/10" : "border-pomo-primary/80 text-pomo-primary bg-pomo-primary/10"
                        )}>
                          <Award size={12} className="mr-1" /> Goal Achieved
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-pomo-secondary flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>
                        {formatDuration(session.totalWorkTime)}
                        {session.cyclesCompleted > 0 && ` · ${session.cyclesCompleted} cycles`}
                      </span>
                    </div>
                  </div>
                  <div className="text-lg font-semibold">
                    +{(session.totalWorkTime / 60).toFixed(1)}h
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className={cn(
            "p-6 text-center rounded-lg border-2 border-dashed",
            isDark ? "border-pomo-muted/30 text-pomo-muted bg-[#221F26]" : "border-pomo-muted/50 text-pomo-secondary bg-pomo-background"
          )}>
            <p>No sessions completed yet</p>
            <p className="text-sm mt-1">Complete a cycle to record a session</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsPanel;