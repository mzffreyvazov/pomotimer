import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useTimer, Session, GOAL_COMPLETED_EVENT } from '@/contexts/TimerContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, PlusCircle, Clock, Trash2, ArrowLeft } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';

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
  const [localSessions, setLocalSessions] = useState<Session[]>(sessions);
  
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
    setLocalSessions(sessions);
  }, [sessions]);
  
  // Load sessions on mount, but not on every refreshSessions change
  useEffect(() => {
    const loadSessions = () => {
      refreshSessions();
    };
    
    loadSessions();
    // Don't include refreshSessions in the dependency array
    // This prevents infinite refresh loops
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
    clearSessions();
    // Also clear the local sessions state for immediate UI update
    setLocalSessions([]);
    setIsDeleteDialogOpen(false);
    toast("Sessions cleared", {
      description: "All session history has been cleared"
    });
  };
  
  // Listen for goal completion event
  useEffect(() => {
    const handleGoalCompleted = () => {
      // Wait a bit to show the dialog after the goal completion toast
      setTimeout(() => {
        setIsAfterCompletion(true);
        setIsGoalDialogOpen(true);
        
        // Force refresh sessions to ensure the UI is up-to-date
        refreshSessions();
      }, 1500);
    };
    
    window.addEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted);
    
    return () => {
      window.removeEventListener(GOAL_COMPLETED_EVENT, handleGoalCompleted);
    };
  }, [refreshSessions]);
  
  // Reset isAfterCompletion when dialog closes
  useEffect(() => {
    if (!isGoalDialogOpen) {
      setIsAfterCompletion(false);
    }
  }, [isGoalDialogOpen]);

  // Debug: Log sessions on component render
  useEffect(() => {
    console.log("Current sessions in SessionsPanel:", sessions);
  }, [sessions]);
  
  // Helper function to simulate goal completion (only in development)
  const simulateGoalCompletion = () => {
    if (goal) {
      // Create a goal completion session
      const goalSession: Session = {
        id: Date.now().toString(),
        date: new Date(),
        focusDuration: 0, 
        breakDuration: 0,
        cyclesCompleted: 0,
        totalWorkTime: Math.round(goal.targetHours * 60)
      };
      
      // Add directly to localSessions first for immediate UI update
      setLocalSessions([goalSession, ...sessions]);
      
      // Add the session through the context
      addSession({
        focusDuration: 0, 
        breakDuration: 0,
        cyclesCompleted: 0,
        totalWorkTime: Math.round(goal.targetHours * 60)
      }, false);
      
      // Clear the goal
      clearGoal();
      
      // Ensure sessions are refreshed from localStorage
      setTimeout(() => {
        refreshSessions();
        
        // Show the new goal dialog
        setIsAfterCompletion(true);
        setIsGoalDialogOpen(true);
      }, 300);
    }
  };
  
  // Add a direct test session function
  const addTestSession = () => {
    const testSession: Session = {
      id: Date.now().toString(),
      date: new Date(),
      focusDuration: 25, 
      breakDuration: 5,
      cyclesCompleted: 1,
      totalWorkTime: 25
    };
    
    // Add directly to localSessions for immediate UI feedback
    setLocalSessions(prev => [testSession, ...prev]);
    
    // Save to localStorage directly
    const updatedSessions = [testSession, ...localSessions];
    try {
      localStorage.setItem('timerSessions', JSON.stringify(updatedSessions));
      console.log("Test session saved to localStorage");
      
      // Reload from localStorage to verify it's working
      setTimeout(refreshSessions, 100);
    } catch (e) {
      console.error('Failed to save test session to localStorage', e);
    }
  };
  
  return (
    <div className={cn(
      "sessions-panel p-4 space-y-6 min-h-[400px]",
      isDark ? "bg-[#221F26] text-white" : "bg-pomo-background text-[#221F26]"
    )}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold">Sessions</h2>
        <div className="flex gap-2">
          {process.env.NODE_ENV === 'development' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addTestSession}
              className="text-xs"
            >
              Add Test Session
            </Button>
          )}
          
          {/* Test button - only in development mode */}
          {process.env.NODE_ENV === 'development' && goal && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={simulateGoalCompletion}
              className="text-xs"
            >
              Test Complete Goal
            </Button>
          )}
          
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
            {/* Removed Add button and dialog */}
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
        {localSessions.length > 0 ? (
          <div className="space-y-3">
            {localSessions.map(session => (              <Card 
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
                      {session.cyclesCompleted === 0 && (
                        <span className={cn(
                          "ml-2 px-2 py-0.5 text-xs rounded-full",
                          isDark ? "bg-pomo-primary/30 text-pomo-primary" : "bg-pomo-primary/20 text-pomo-primary"
                        )}>
                          Goal Achieved
                        </span>
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