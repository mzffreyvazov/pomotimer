import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTimer } from './TimerContext';

type NotificationType = 'timer' | 'goal';
type NotificationTiming = 'every' | 'last';

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
}

const defaultSettings: NotificationSettings = {
  timerNotificationsEnabled: true,
  timerNotificationTiming: 'last',
  timerNotificationValue: 5,

  goalNotificationsEnabled: true,
  goalNotificationTiming: 'every',
  goalNotificationValue: 1,

  soundNotificationsEnabled: true,
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
  
  // Initialize audio element
  useEffect(() => {
    const audio = new Audio('/sounds/alarm.mp3');
    audio.loop = true;
    setAlarmAudio(audio);
    
    return () => {
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
    if (!settings.soundNotificationsEnabled || !alarmAudio) return;
    
    try {
      alarmAudio.currentTime = 0;
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
        stopAlarmSound
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
