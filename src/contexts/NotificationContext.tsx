import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTimer } from './TimerContext';
import { getNotificationSoundPath } from '@/lib/notificationSounds';

type NotificationType = 'timer' | 'goal';
type NotificationTiming = 'every' | 'last';
export type NotificationSoundOption = 'none' | 'alarm' | 'bell' | 'chime' | 'alarm-digital' | 'notification' | 'alert-tone';

interface NotificationSettings {
  // Timer notification settings
  timerNotificationsEnabled: boolean;
  timerNotificationTiming: NotificationTiming; // 'every' | 'last'
  timerNotificationValue: number; // in minutes

  // Goal notification settings
  goalNotificationsEnabled: boolean;
  goalNotificationTiming: NotificationTiming; // 'every' | 'last'
  goalNotificationValue: number; // in hours

  // Sound settings
  soundNotificationsEnabled: boolean;
  notificationSound: NotificationSoundOption;
  notificationVolume: number;
}

interface NotificationContextType {
  // Permission handling
  notificationPermission: NotificationPermission;
  requestPermission: () => Promise<boolean>;
  
  // Settings
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  
  // Notification methods
  sendTimerNotification: (title: string, body: string) => void;
  sendGoalNotification: (title: string, body: string) => void;
  playAlarmSound: () => void;
  stopAlarmSound: () => void;
  previewNotificationSound: (sound: NotificationSoundOption) => void;
  toggleSoundPreview: (sound: NotificationSoundOption) => boolean;
  isNotificationSoundPlaying: boolean;
}

const defaultSettings: NotificationSettings = {
  timerNotificationsEnabled: true,
  timerNotificationTiming: 'last',
  timerNotificationValue: 5,

  goalNotificationsEnabled: true,
  goalNotificationTiming: 'every',
  goalNotificationValue: 1,

  soundNotificationsEnabled: true,
  notificationSound: 'alarm',
  notificationVolume: 50, // Using 50 as default (out of 100)
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { timeRemaining, mode, goal } = useTimer();
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Failed to parse notification settings', e);
        return defaultSettings;
      }
    }
    return defaultSettings;
  });
  
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [alarmAudio, setAlarmAudio] = useState<HTMLAudioElement | null>(null);
  const [soundPreview, setSoundPreview] = useState<HTMLAudioElement | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  // Initialize audio elements and update when sound changes
  useEffect(() => {
    const soundPath = getNotificationSoundPath(settings.notificationSound);
    const audio = new Audio(soundPath);
    audio.loop = true;
    
    // Ensure volume is a valid number between 0 and 1
    const volumeValue = settings.notificationVolume;
    const safeVolume = isFinite(volumeValue) ? Math.min(Math.max(volumeValue / 100, 0), 1) : 0.5;
    audio.volume = safeVolume;
    
    setAlarmAudio(audio);
    
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [settings.notificationSound, settings.notificationVolume]);
  
  useEffect(() => {
    const audio = new Audio();
    
    // Add an event listener to handle when playback finishes
    const handleEnded = () => {
      setIsPreviewing(false);
    };
    
    audio.addEventListener('ended', handleEnded);
    setSoundPreview(audio);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
    };
  }, []);
  
  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);
  
  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };
  
  // Update notification settings
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  // Send a browser notification
  const sendNotification = (title: string, body: string, icon?: string) => {
    if (notificationPermission !== 'granted') return;
    
    try {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico'
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };
  
  // Specific notification methods
  const sendTimerNotification = (title: string, body: string) => {
    if (!settings.timerNotificationsEnabled) return;
    sendNotification(title, body);
  };
  
  const sendGoalNotification = (title: string, body: string) => {
    if (!settings.goalNotificationsEnabled) return;
    sendNotification(title, body);
  };
  
  // Sound notification methods
  const playAlarmSound = () => {
    if (!settings.soundNotificationsEnabled || !alarmAudio || settings.notificationSound === 'none') return;
    
    try {
      // Ensure we're using the current selected sound
      const soundPath = getNotificationSoundPath(settings.notificationSound);
      if (alarmAudio.src !== soundPath) {
        alarmAudio.src = soundPath;
      }
      
      alarmAudio.currentTime = 0;
      
      // Ensure volume is a valid number between 0 and 1
      const volumeValue = settings.notificationVolume;
      const safeVolume = isFinite(volumeValue) ? Math.min(Math.max(volumeValue / 100, 0), 1) : 0.5;
      alarmAudio.volume = safeVolume;
      
      alarmAudio.play();
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  };
  
  const stopAlarmSound = () => {
    if (!alarmAudio) return;
    
    try {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
    } catch (error) {
      console.error('Error stopping alarm sound:', error);
    }
  };
  
  // Preview notification sound
  const previewNotificationSound = (sound: NotificationSoundOption) => {
    if (sound === 'none' || !soundPreview) {
      stopSoundPreview();
      return;
    }
    
    const soundPath = getNotificationSoundPath(sound);
    if (!soundPath) return;
    
    soundPreview.src = soundPath;
    
    // Ensure volume is a valid number between 0 and 1
    const volumeValue = settings.notificationVolume;
    const safeVolume = isFinite(volumeValue) ? Math.min(Math.max(volumeValue / 100, 0), 1) : 0.5;
    soundPreview.volume = safeVolume;
    
    try {
      soundPreview.currentTime = 0;
      soundPreview.play()
        .then(() => {
          // For sounds that might be long, automatically stop after 3 seconds
          setTimeout(() => {
            if (soundPreview && !soundPreview.paused) {
              stopSoundPreview();
            }
          }, 3000);
        })
        .catch(error => {
          console.error('Error playing sound preview:', error);
        });
      
      setIsPreviewing(true);
    } catch (error) {
      console.error('Error playing sound preview:', error);
    }
  };
  
  const stopSoundPreview = () => {
    if (!soundPreview) return;
    
    try {
      soundPreview.pause();
      soundPreview.currentTime = 0;
      setIsPreviewing(false);
    } catch (error) {
      console.error('Error stopping sound preview:', error);
    }
  };
  
  // Toggle sound preview on/off
  const toggleSoundPreview = (sound: NotificationSoundOption) => {
    if (isPreviewing) {
      stopSoundPreview();
      return false;
    } else {
      previewNotificationSound(sound);
      return true;
    }
  };
  
  return (
    <NotificationContext.Provider
      value={{
        notificationPermission,
        requestPermission,
        settings,
        updateSettings,
        sendTimerNotification,
        sendGoalNotification,
        playAlarmSound,
        stopAlarmSound,
        previewNotificationSound,
        toggleSoundPreview,
        isNotificationSoundPlaying: isPreviewing
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
