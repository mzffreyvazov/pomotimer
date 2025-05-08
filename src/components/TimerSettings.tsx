import React, { useState } from 'react';
import { useTimer, TimerMode } from '@/contexts/TimerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
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
      autoStartBreaks: newAutoStartBreaks
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
  
  return (
    <div className="settings-panel p-6 animate-scale-in w-full max-w-md">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold">Timer Settings</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft size={18} />
          <span className="ml-1">Back</span>
        </Button>
      </div>
      
      <Tabs defaultValue="timers">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="timers">Timer Durations</TabsTrigger>
          <TabsTrigger value="sessions">Quick Switch</TabsTrigger>
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
              
              {/* Auto-start breaks toggle */}
              <div className="flex items-center justify-between py-2 mt-2 border-t border-pomo-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="autoStartBreaks" className="text-base">Auto-start breaks</Label>
                  <p className="text-xs text-pomo-secondary">Automatically start break timers after focus sessions</p>
                </div>
                <Switch 
                  id="autoStartBreaks" 
                  checked={newAutoStartBreaks}
                  onCheckedChange={setNewAutoStartBreaks}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className={cn(
                "w-full",
                isDark 
                  ? "bg-pomo-primary/80 hover:bg-pomo-primary text-pomo-background" 
                  : "bg-pomo-primary text-pomo-primary-foreground hover:bg-pomo-primary/90"
              )}
            >
              Save Settings
            </Button>
          </form>
        </TabsContent>
        
        <TabsContent value="sessions" className="animate-fade-in">
          <div className="space-y-4">
            <p className="text-sm text-pomo-secondary">Quickly switch to a different timer mode:</p>
            
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline"
                className={cn(
                  "justify-start",
                  isDark
                    ? "bg-pomo-primary/20 hover:bg-pomo-primary/30 text-pomo-primary"
                    : "bg-pomo-primary/30 hover:bg-pomo-primary/40 text-pomo-primary"
                )}
                onClick={() => handleModeSelect('focus')}
              >
                <span className="mr-2">●</span> Focus Session ({focusTime}m)
              </Button>
              
              <Button 
                variant="outline"
                className={cn(
                  "justify-start",
                  isDark
                    ? "bg-green-500/20 hover:bg-green-500/30 text-green-300"
                    : "bg-green-500/20 hover:bg-green-500/30 text-green-700"
                )}
                onClick={() => handleModeSelect('break')}
              >
                <span className="mr-2">●</span> Break ({breakTime}m)
              </Button>
            </div>
            
            <div className={cn(
              "mt-4 p-3 rounded-lg text-sm",
              isDark ? "bg-pomo-muted/30" : "bg-pomo-muted/20"
            )}>
              <p className="text-pomo-secondary">
                Current settings: {focusTime}m focus, {breakTime}m break, 
                repeating for {cycleCount} cycles<br/>
                Auto-start breaks: {autoStartBreaks ? "On" : "Off"}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimerSettings;
