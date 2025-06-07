import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
// import { useTimer } from './TimerContext'; // No longer needed here
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
  playAlarmSound: (onCompletionCallback?: () => void) => void;
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
  // const { timeRemaining, mode, goal } = useTimer(); // Removed this line
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
  const alarmLoopCountRef = useRef<number>(0);
  const alarmCompletionCallbackRef = useRef<(() => void) | null>(null);
  const isAlarmPlayingRef = useRef<boolean>(false); // NEW: Flag to block multiple concurrent plays

  // Effect to create/update the main alarmAudio object based on settings
  useEffect(() => {
    if (alarmAudio) {
      alarmAudio.pause();
      // Previous event listeners are on the old instance, no need to remove manually here
      // as we are creating a new Audio object.
    }

    const soundPath = getNotificationSoundPath(settings.notificationSound);
    if (!soundPath || settings.notificationSound === 'none') {
      setAlarmAudio(null);
      return;
    }

    const newAudio = new Audio(soundPath);
    newAudio.loop = false;
    const volumeValue = settings.notificationVolume;
    const safeVolume = isFinite(volumeValue) ? Math.min(Math.max(volumeValue / 100, 0), 1) : 0.5;
    newAudio.volume = safeVolume;
    setAlarmAudio(newAudio); // This will trigger the listener attachment effect

    return () => {
      newAudio.pause(); // Cleanup this specific newAudio instance
    };
  }, [settings.notificationSound, settings.notificationVolume]);

  // Effect to attach/detach 'ended' event listener to the current alarmAudio object
  useEffect(() => {
    const handleAlarmEnded = () => {
      alarmLoopCountRef.current += 1;
      console.log(`[NotificationContext] handleAlarmEnded: alarmLoopCountRef.current is now ${alarmLoopCountRef.current}`);
      if (alarmAudio) { // Check if alarmAudio is still valid
        if (alarmLoopCountRef.current < 2) { // Play a total of 2 times
          console.log(`[NotificationContext] handleAlarmEnded: Replaying alarm. Loop count: ${alarmLoopCountRef.current}`);
          alarmAudio.currentTime = 0;
          alarmAudio.play().catch(error => {
            console.error('[NotificationContext] Error replaying alarm sound:', error);
            isAlarmPlayingRef.current = false;
            if (alarmCompletionCallbackRef.current) {
              alarmCompletionCallbackRef.current();
              alarmCompletionCallbackRef.current = null; // Consume callback
            }
          });
        } else {
          console.log(`[NotificationContext] handleAlarmEnded: Alarm finished looping. Loop count: ${alarmLoopCountRef.current}. Calling completion callback.`);
          isAlarmPlayingRef.current = false;
          if (alarmCompletionCallbackRef.current) {
            alarmCompletionCallbackRef.current();
            alarmCompletionCallbackRef.current = null; // Consume callback
          }
        }
      } else { // alarmAudio became null during playback (e.g., settings changed)
        console.log('[NotificationContext] handleAlarmEnded: alarmAudio is null. Calling completion callback if present.');
        isAlarmPlayingRef.current = false;
        if (alarmCompletionCallbackRef.current) {
          alarmCompletionCallbackRef.current();
          alarmCompletionCallbackRef.current = null; // Consume callback
        }
      }
    };

    if (alarmAudio) {
      alarmAudio.addEventListener('ended', handleAlarmEnded);
    }

    return () => {
      if (alarmAudio) {
        alarmAudio.removeEventListener('ended', handleAlarmEnded);
        // Do not pause here if it's being replaced by a new sound,
        // the creation effect handles pausing the old one.
      }
      // If alarmAudio becomes null, the callback should be cleared if it hasn't fired.
      // This is handled by stopAlarmSound or if it fires naturally.
    };
  }, [alarmAudio]); // Re-run when alarmAudio object instance changes
  
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
  const playAlarmSound = (onCompletionCallback?: () => void) => {
    if (isAlarmPlayingRef.current) {
      console.log('[NotificationContext] playAlarmSound: Alarm already playing.');
      return;
    }
    if (!settings.soundNotificationsEnabled || !alarmAudio || settings.notificationSound === 'none') {
      console.log('[NotificationContext] playAlarmSound: Sound notifications disabled, no alarmAudio, or sound is "none". Calling callback immediately.');
      onCompletionCallback?.();
      return;
    }
    
    isAlarmPlayingRef.current = true; // Mark alarm as playing
    alarmLoopCountRef.current = 0;
    console.log(`[NotificationContext] playAlarmSound: Initial play. alarmLoopCountRef reset to ${alarmLoopCountRef.current}`);
    alarmCompletionCallbackRef.current = onCompletionCallback;
  
    try {
      alarmAudio.currentTime = 0;
      alarmAudio.play().catch(error => {
        console.error('[NotificationContext] Error playing alarm sound:', error);
        isAlarmPlayingRef.current = false;
        if (alarmCompletionCallbackRef.current) {
          alarmCompletionCallbackRef.current();
          alarmCompletionCallbackRef.current = null;
        }
      });
    } catch (error) {
      console.error('[NotificationContext] Error playing alarm sound:', error);
      isAlarmPlayingRef.current = false;
      if (alarmCompletionCallbackRef.current) {
        alarmCompletionCallbackRef.current();
        alarmCompletionCallbackRef.current = null;
      }
    }
  };
  
  const stopAlarmSound = () => {
    if (!alarmAudio) return;
    console.log('[NotificationContext] stopAlarmSound: Stopping alarm sound.');
    try {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      alarmLoopCountRef.current = 2; // Prevent further loops
      // Reset the flag so calls to play can resume later
      isAlarmPlayingRef.current = false;
      if (alarmCompletionCallbackRef.current) {
        alarmCompletionCallbackRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping alarm sound:', error);
    }
  };
  
  // Add preview and toggle functions for notification sound:
  const previewNotificationSound = (sound: NotificationSoundOption) => {
    if (sound === 'none' || !soundPreview) {
      stopSoundPreview();
      return;
    }
    const soundPath = getNotificationSoundPath(sound);
    if (!soundPath) return;
    soundPreview.src = soundPath;
    const volumeValue = settings.notificationVolume;
    const safeVolume = isFinite(volumeValue) ? Math.min(Math.max(volumeValue / 100, 0), 1) : 0.5;
    soundPreview.volume = safeVolume;
    try {
      soundPreview.currentTime = 0;
      soundPreview.play()
        .then(() => {
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

  const toggleSoundPreview = (sound: NotificationSoundOption): boolean => {
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
