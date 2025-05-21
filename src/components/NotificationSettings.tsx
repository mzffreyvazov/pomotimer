import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellRing, BellOff, Clock, AlarmClock, Goal } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import NotificationSoundControl from './NotificationSoundControl';
import './notification-input-hide-arrows.css';

const NotificationSettings: React.FC = () => {
  const { settings, updateSettings, notificationPermission, requestPermission } = useNotifications();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const {
    timerNotificationsEnabled,
    timerNotificationTiming,
    timerNotificationValue,
    goalNotificationsEnabled,
    goalNotificationTiming,
    goalNotificationValue,
    soundNotificationsEnabled,

  } = settings;
  
  const [showPermissionButton, setShowPermissionButton] = useState(notificationPermission !== 'granted');
  
  // Check if permission needs to be requested
  useEffect(() => {
    setShowPermissionButton(notificationPermission !== 'granted');
  }, [notificationPermission]);
  
  // Handle requesting notification permission
  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    setShowPermissionButton(!granted);
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Permission section */}
      {showPermissionButton && (
        <div className="p-4 border border-pomo-muted/30 rounded-lg bg-pomo-muted/10 mb-4">
          <div className="flex items-start gap-3">
            <Bell className="text-pomo-primary mt-1" size={18} />
            <div>
              <h3 className="font-medium text-sm mb-1">Enable browser notifications</h3>
              <p className="text-xs text-pomo-secondary mb-3">
                Get notified when your timer completes or when you reach your goals
              </p>
              <Button 
                size="sm" 
                onClick={handleRequestPermission}
                className="text-xs h-8"
              >
                Enable Notifications
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Notifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-pomo-muted/30">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-pomo-primary" />
            <h3 className="font-medium">Timer Notifications</h3>
          </div>
          <Switch 
            checked={timerNotificationsEnabled}
            onCheckedChange={(checked) => updateSettings({ timerNotificationsEnabled: checked })}
          />
        </div>
        
        {timerNotificationsEnabled && (
          <div className="pl-6 space-y-4">
            <div className="space-y-2">
              <Label>Notify me</Label>
              <div className="flex gap-3">
                <Select 
                  value={timerNotificationTiming} 
                  onValueChange={(value) => updateSettings({ timerNotificationTiming: value as 'every' | 'last' })}
                >
                  <SelectTrigger className={cn(
                    "w-[120px] border-pomo-muted focus-visible:ring-pomo-primary",
                    isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
                  )}>
                    <SelectValue placeholder="Timing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="every">Every</SelectItem>
                    <SelectItem value="last">Last</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  type="number" 
                  min={1}
                  max={60}
                  value={timerNotificationValue}
                  onChange={(e) => updateSettings({ timerNotificationValue: parseInt(e.target.value) || 1 })}
                  className={cn(
                    "w-[65px] border-pomo-muted focus-visible:ring-pomo-primary",
                    isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
                  )}
                />
                <span className="self-center text-sm text-pomo-secondary">min</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Goal Notifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-pomo-muted/30">
          <div className="flex items-center gap-2">
            <Goal size={18} className="text-pomo-primary" />
            <h3 className="font-medium">Session Notifications</h3>
          </div>
          <Switch 
            checked={goalNotificationsEnabled}
            onCheckedChange={(checked) => updateSettings({ goalNotificationsEnabled: checked })}
          />
        </div>
        
        {goalNotificationsEnabled && (
          <div className="pl-6 space-y-4">
            <div className="space-y-2">
              <Label>Notify me</Label>
              <div className="flex gap-3">
                <Select 
                  value={goalNotificationTiming} 
                  onValueChange={(value) => updateSettings({ goalNotificationTiming: value as 'every' | 'last' })}
                >
                  <SelectTrigger className={cn(
                    "w-[120px] border-pomo-muted focus-visible:ring-pomo-primary",
                    isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
                  )}>
                    <SelectValue placeholder="Timing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="every">Every</SelectItem>
                    <SelectItem value="last">Last</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  type="number" 
                  min={0}
                  max={24}
                  value={Math.floor(goalNotificationValue)}
                  onChange={(e) => {
                    const hours = parseInt(e.target.value) || 0;
                    const minutes = goalNotificationValue % 1;
                    updateSettings({ goalNotificationValue: hours + minutes });
                  }}
                  className={cn(
                    "w-[65px]  border-pomo-muted focus-visible:ring-pomo-primary",
                    isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
                  )}
                />
                <span className="self-center text-sm text-pomo-secondary">hours</span>
                <Input 
                  type="number" 
                  min={0}
                  max={59}
                  value={Math.round((goalNotificationValue % 1) * 60)}
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value) || 0;
                    const hours = Math.floor(goalNotificationValue);
                    updateSettings({ goalNotificationValue: hours + minutes / 60 });
                  }}
                  className={cn(
                    "w-[65px] border-pomo-muted focus-visible:ring-pomo-primary",
                    isDark ? "bg-pomo-muted/50" : "bg-pomo-muted/30"
                  )}
                />
                <span className="self-center text-sm text-pomo-secondary">min</span>
              </div>
            </div>
          </div>
        )}
      </div>
        {/* Sound Notifications */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-pomo-muted/30">
          <div className="flex items-center gap-2">
            <AlarmClock size={18} className="text-pomo-primary" />
            <h3 className="font-medium">Alarm Sounds</h3>
          </div>
          <Switch 
            checked={soundNotificationsEnabled}
            onCheckedChange={(checked) => updateSettings({ soundNotificationsEnabled: checked })}
          />
        </div>
        
        {soundNotificationsEnabled && (
          <div className="mt-2">
            <NotificationSoundControl />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
