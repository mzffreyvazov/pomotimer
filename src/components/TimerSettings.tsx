
import React, { useState } from 'react';
import { useTimer, TimerMode } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
    updateSettings,
    setMode
  } = useTimer();
  
  const [newFocusTime, setNewFocusTime] = useState<number>(focusTime);
  const [newShortBreakTime, setNewShortBreakTime] = useState<number>(shortBreakTime);
  const [newLongBreakTime, setNewLongBreakTime] = useState<number>(longBreakTime);
  const [newLongBreakInterval, setNewLongBreakInterval] = useState<number>(longBreakInterval);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateSettings({
      focusTime: Math.max(1, Math.min(120, newFocusTime)), // Limit between 1-120 minutes
      shortBreakTime: Math.max(1, Math.min(30, newShortBreakTime)), // Limit between 1-30 minutes
      longBreakTime: Math.max(1, Math.min(60, newLongBreakTime)), // Limit between 1-60 minutes
      longBreakInterval: Math.max(1, Math.min(10, newLongBreakInterval)), // Limit between 1-10 sessions
    });
    
    onClose();
  };
  
  // Handle direct timer mode switching
  const handleModeSelect = (mode: TimerMode) => {
    setMode(mode);
    onClose();
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
              <div className="space-y-2">
                <Label htmlFor="focusTime">Focus Session (minutes)</Label>
                <Input 
                  id="focusTime" 
                  type="number" 
                  min={1} 
                  max={120}
                  value={newFocusTime} 
                  onChange={(e) => setNewFocusTime(Number(e.target.value))}
                  className="bg-pomo-muted/50 border-pomo-muted focus-visible:ring-pomo-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shortBreakTime">Short Break (minutes)</Label>
                <Input 
                  id="shortBreakTime" 
                  type="number" 
                  min={1} 
                  max={30}
                  value={newShortBreakTime} 
                  onChange={(e) => setNewShortBreakTime(Number(e.target.value))}
                  className="bg-pomo-muted/50 border-pomo-muted focus-visible:ring-pomo-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="longBreakTime">Long Break (minutes)</Label>
                <Input 
                  id="longBreakTime" 
                  type="number"
                  min={1}
                  max={60}
                  value={newLongBreakTime} 
                  onChange={(e) => setNewLongBreakTime(Number(e.target.value))}
                  className="bg-pomo-muted/50 border-pomo-muted focus-visible:ring-pomo-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="longBreakInterval">Long Break Interval (sessions)</Label>
                <Input 
                  id="longBreakInterval" 
                  type="number"
                  min={1}
                  max={10}
                  value={newLongBreakInterval} 
                  onChange={(e) => setNewLongBreakInterval(Number(e.target.value))}
                  className="bg-pomo-muted/50 border-pomo-muted focus-visible:ring-pomo-primary"
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
                {longBreakTime}m long break every {longBreakInterval} sessions
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimerSettings;
