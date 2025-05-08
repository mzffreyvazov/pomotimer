import React, { useState } from 'react';
import { useTimer, TimerMode } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';

interface TimerSettingsProps {
  onClose: () => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({ onClose }) => {
  const { 
    focusTime, 
    shortBreakTime, 
    longBreakTime, 
    longBreakInterval,
    autoStartBreaks,
    updateSettings,
    setMode
  } = useTimer();
  
  // Use string state for inputs to allow complete deletion
  const [newFocusTime, setNewFocusTime] = useState<string>(focusTime.toString());
  const [newShortBreakTime, setNewShortBreakTime] = useState<string>(shortBreakTime.toString());
  const [newLongBreakTime, setNewLongBreakTime] = useState<string>(longBreakTime.toString());
  const [newLongBreakInterval, setNewLongBreakInterval] = useState<string>(longBreakInterval.toString());
  const [newAutoStartBreaks, setNewAutoStartBreaks] = useState<boolean>(autoStartBreaks);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert to numbers, default to current values if empty
    const focusVal = newFocusTime === '' ? focusTime : parseInt(newFocusTime);
    const shortBreakVal = newShortBreakTime === '' ? shortBreakTime : parseInt(newShortBreakTime);
    const longBreakVal = newLongBreakTime === '' ? longBreakTime : parseInt(newLongBreakTime);
    const intervalVal = newLongBreakInterval === '' ? longBreakInterval : parseInt(newLongBreakInterval);
    
    updateSettings({
      focusTime: Math.max(1, Math.min(120, focusVal)), // Limit between 1-120 minutes
      shortBreakTime: Math.max(1, Math.min(30, shortBreakVal)), // Limit between 1-30 minutes
      longBreakTime: Math.max(1, Math.min(60, longBreakVal)), // Limit between 1-60 minutes
      longBreakInterval: Math.max(1, Math.min(10, intervalVal)), // Limit between 1-10 sessions
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
  
  const setShortBreakPreset = (minutes: number) => {
    setNewShortBreakTime(minutes.toString());
  };
  
  const setLongBreakPreset = (minutes: number) => {
    setNewLongBreakTime(minutes.toString());
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
                    className="bg-pomo-muted/50 border-pomo-muted focus-visible:ring-pomo-primary"
                  />
                </div>
              </div>
              
              {/* Short Break */}
              <div className="space-y-2">
                <Label htmlFor="shortBreakTime" className="flex justify-between">
                  Short Break (minutes)
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15].map(time => (
                    <Button 
                      key={`short-${time}`}
                      type="button"
                      size="sm"
                      variant={newShortBreakTime === time.toString() ? "default" : "outline"}
                      className="text-xs h-10"
                      onClick={() => setShortBreakPreset(time)}
                    >
                      {time}
                    </Button>
                  ))}
                  <Input 
                    id="shortBreakTime" 
                    type="text" 
                    inputMode="numeric"
                    value={newShortBreakTime} 
                    onChange={(e) => handleInputChange(setNewShortBreakTime, e.target.value)}
                    className="bg-pomo-muted/50 border-pomo-muted focus-visible:ring-pomo-primary"
                  />
                </div>
              </div>
              
              {/* Long Break */}
              <div className="space-y-2">
                <Label htmlFor="longBreakTime" className="flex justify-between">
                  Long Break (minutes)
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 20, 30].map(time => (
                    <Button 
                      key={`long-${time}`}
                      type="button"
                      size="sm" 
                      variant={newLongBreakTime === time.toString() ? "default" : "outline"}
                      className="text-xs h-10"
                      onClick={() => setLongBreakPreset(time)}
                    >
                      {time}
                    </Button>
                  ))}
                  <Input 
                    id="longBreakTime" 
                    type="text"
                    inputMode="numeric"
                    value={newLongBreakTime} 
                    onChange={(e) => handleInputChange(setNewLongBreakTime, e.target.value)}
                    className="bg-pomo-muted/50 border-pomo-muted focus-visible:ring-pomo-primary"
                  />
                </div>
              </div>
              
              {/* Long Break Interval */}
              <div className="space-y-2">
                <Label htmlFor="longBreakInterval">Long Break Interval (sessions)</Label>
                <Input 
                  id="longBreakInterval" 
                  type="text"
                  inputMode="numeric"
                  value={newLongBreakInterval} 
                  onChange={(e) => handleInputChange(setNewLongBreakInterval, e.target.value)}
                  className="bg-pomo-muted/50 border-pomo-muted focus-visible:ring-pomo-primary"
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
              className="w-full bg-pomo-primary/80 hover:bg-pomo-primary text-pomo-background"
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
                className="bg-pomo-primary/20 hover:bg-pomo-primary/30 text-pomo-primary justify-start"
                onClick={() => handleModeSelect('focus')}
              >
                <span className="mr-2">●</span> Focus Session ({focusTime}m)
              </Button>
              
              <Button 
                variant="outline"
                className="bg-green-500/20 hover:bg-green-500/30 text-green-300 justify-start"
                onClick={() => handleModeSelect('shortBreak')}
              >
                <span className="mr-2">●</span> Short Break ({shortBreakTime}m)
              </Button>
              
              <Button 
                variant="outline"
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 justify-start"
                onClick={() => handleModeSelect('longBreak')}
              >
                <span className="mr-2">●</span> Long Break ({longBreakTime}m)
              </Button>
            </div>
            
            <div className="mt-4 p-3 rounded-lg bg-pomo-muted/30 text-sm">
              <p className="text-pomo-secondary">
                Current settings: {focusTime}m focus, {shortBreakTime}m short break, 
                {longBreakTime}m long break every {longBreakInterval} sessions<br/>
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
