import React, { useState } from 'react';
import { useTimer, TimerMode } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, BellRing } from 'lucide-react';
import NotificationSettings from './NotificationSettings';
import { cn } from '@/lib/utils';

interface TimerSettingsProps {
  onClose: () => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({ onClose }) => {
  const { 
    focusTime, 
    breakTime, 
    cycleCount,
    autoStartBreaks,
    allowDragging,
    updateSettings,
    setMode
  } = useTimer();
  
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    // Use string state for inputs to allow complete deletion
  const [newFocusTime, setNewFocusTime] = useState<string>(focusTime.toString());
  const [newBreakTime, setNewBreakTime] = useState<string>(breakTime.toString());
  const [newCycleCount, setNewCycleCount] = useState<string>(cycleCount.toString());
  const [newAutoStartBreaks, setNewAutoStartBreaks] = useState<boolean>(autoStartBreaks);
  const [newAllowDragging, setNewAllowDragging] = useState<boolean>(allowDragging);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert to numbers, default to current values if empty
    const focusVal = newFocusTime === '' ? focusTime : parseInt(newFocusTime);
    const breakVal = newBreakTime === '' ? breakTime : parseInt(newBreakTime);
    const cycleVal = newCycleCount === '' ? cycleCount : parseInt(newCycleCount);
    
    updateSettings({
      focusTime: Math.max(1, Math.min(120, focusVal)), // Limit between 1-120 minutes
      breakTime: Math.max(1, Math.min(30, breakVal)), // Limit between 1-30 minutes
      cycleCount: Math.max(1, Math.min(10, cycleVal)), // Limit between 1-10 sessions
      autoStartBreaks: newAutoStartBreaks,
      allowDragging: newAllowDragging
    });
    
    onClose();
  };
  
  // Handle input changes allowing empty values
  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    if (value === '' || /^\d+$/.test(value)) {
      setter(value);
    }
  };
  
  // Handle direct timer mode switching
  const handleModeSelect = (mode: TimerMode) => {
    setMode(mode);
    onClose();
  };

  // Handle preset time selections
  const setFocusPreset = (minutes: number) => {
    setNewFocusTime(minutes.toString());
  };
  
  const setBreakPreset = (minutes: number) => {
    setNewBreakTime(minutes.toString());
  };

  // Add keyboard shortcut for 'D' key to toggle dragging in settings panel
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === "KeyD" || e.key === "d" || e.key === "D") && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setNewAllowDragging((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  return (
    <div className="settings-panel p-6 animate-scale-in w-full max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold">Settings</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft size={18} />
          <span className="ml-1">Back</span>
        </Button>
      </div>
      
      <Tabs defaultValue="timers">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="timers" className="flex items-center gap-1">
            <Clock size={14} />
            <span>Timer Settings</span>
          </TabsTrigger>
          {/* <TabsTrigger value="sessions">Quick Switch</TabsTrigger> */}
          <TabsTrigger value="notifications" className="flex items-center gap-1">
            <BellRing size={14} />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="timers" className="animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {/* Focus Session */}
              <div className="space-y-2">
                <Label htmlFor="focusTime" className="flex justify-between">
                  Focus Session (minutes)
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 45, 60].map(time => (
                    <Button 
                      key={`focus-${time}`}
                      type="button"
                      size="sm"
                      variant={newFocusTime === time.toString() ? "default" : "outline"}
                      className="text-xs h-10"
                      onClick={() => setFocusPreset(time)}
                    >
                      {time}
                    </Button>
                  ))}
                  <Input 
                    id="focusTime" 
                    type="text" 
                    inputMode="numeric"
                    value={newFocusTime} 
                    onChange={(e) => handleInputChange(setNewFocusTime, e.target.value)}
                    className={cn(
                      "border-pomo-muted focus-visible:ring-pomo-primary",
                      isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
                    )}
                  />
                </div>
              </div>
              
              {/* Break */}
              <div className="space-y-2">
                <Label htmlFor="breakTime" className="flex justify-between">
                  Break (minutes)
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15].map(time => (
                    <Button 
                      key={`break-${time}`}
                      type="button"
                      size="sm"
                      variant={newBreakTime === time.toString() ? "default" : "outline"}
                      className="text-xs h-10"
                      onClick={() => setBreakPreset(time)}
                    >
                      {time}
                    </Button>
                  ))}
                  <Input 
                    id="breakTime" 
                    type="text" 
                    inputMode="numeric"
                    value={newBreakTime} 
                    onChange={(e) => handleInputChange(setNewBreakTime, e.target.value)}
                    className={cn(
                      "border-pomo-muted focus-visible:ring-pomo-primary",
                      isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
                    )}
                  />
                </div>
              </div>
              
              {/* Cycle Count */}
              <div className="space-y-2">
                <Label htmlFor="cycleCount">Cycles to Repeat</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4].map(cycle => (
                    <Button 
                      key={`cycle-${cycle}`}
                      type="button"
                      size="sm"
                      variant={newCycleCount === cycle.toString() ? "default" : "outline"}
                      className="text-xs h-10"
                      onClick={() => setNewCycleCount(cycle.toString())}
                    >
                      {cycle}
                    </Button>
                  ))}
                  <Input 
                    id="cycleCount" 
                    type="text"
                    inputMode="numeric"
                    value={newCycleCount} 
                    onChange={(e) => handleInputChange(setNewCycleCount, e.target.value)}
                    className={cn(
                      "border-pomo-muted focus-visible:ring-pomo-primary",
                      isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
                    )}
                  />
                </div>
              </div>
              
              {/* Auto-start breaks toggle */}
              <div className="flex items-center justify-between py-2 mt-1 border-t border-pomo-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="autoStartBreaks" className="text-sm">Auto-start breaks</Label>
                  <p className="text-xs text-pomo-secondary">Automatically start break timers after focus sessions</p>
                </div>
                <Switch 
                  id="autoStartBreaks" 
                  checked={newAutoStartBreaks}
                  onCheckedChange={setNewAutoStartBreaks}
                />
              </div>
              
              {/* Allow dragging toggle */}
              <div className="flex items-center justify-between py-2 mt-1 border-t border-pomo-muted/30">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="allowDragging" className="text-sm">Allow timer dragging</Label>
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-pomo-muted/30 text-xs font-medium text-pomo-secondary border border-pomo-muted/60 hidden sm:inline">
                      D to toggle
                    </span>
                  </div>
                  <p className="text-xs text-pomo-secondary mt-0.5 py-0.5">
                    Adjust timer by dragging the progress circle
                  </p>
                </div>
                <Switch 
                  id="allowDragging" 
                  checked={newAllowDragging}
                  onCheckedChange={setNewAllowDragging}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className={cn(
                "w-full text-white", 
                isDark 
                  ? "bg-pomo-primary/80 hover:bg-pomo-primary text-pomo-background" 
                  : "bg-pomo-primary hover:bg-pomo-primary/90"
              )}
            >
              Save Settings
            </Button>
          </form>
        </TabsContent>
        
        {/* <TabsContent value="sessions" className="animate-fade-in">
          <div className="space-y-5">
            <p className="text-sm text-pomo-secondary">
              Switch to a specific timer mode directly:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => handleModeSelect('focus')}
                className="h-20 flex flex-col items-center justify-center gap-1"
                variant="outline"
              >
                <span className="text-lg font-medium">{focusTime} min</span>
                <span className="text-xs text-pomo-secondary">Focus Session</span>
              </Button>
              <Button 
                onClick={() => handleModeSelect('break')}
                className="h-20 flex flex-col items-center justify-center gap-1"
                variant="outline"
              >
                <span className="text-lg font-medium">{breakTime} min</span>
                <span className="text-xs text-pomo-secondary">Break</span>
              </Button>
            </div>
            
            <div className={cn(
              "mt-4 p-3 rounded-lg text-sm",
              isDark ? "bg-pomo-muted/30" : "bg-pomo-muted/20"
            )}>
              <p className="text-pomo-secondary">
                Current settings: {focusTime}m focus, {breakTime}m break, 
                repeating for {cycleCount} cycles<br/>
                Auto-start breaks: {autoStartBreaks ? "On" : "Off"}<br/>
                Allow timer dragging: {allowDragging ? "On" : "Off"}
              </p>
            </div>
          </div>
        </TabsContent> */}
        
        {/* New Notifications Tab */}
        <TabsContent value="notifications" className="animate-fade-in">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimerSettings;
