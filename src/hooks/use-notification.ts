import { useState, useEffect, useCallback } from 'react';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission | 'default'>(
    'default'
  );

  // Check notification permission on mount
  useEffect(() => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    setPermission(Notification.permission);
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [permission]);

  // Send notification only if page is not visible
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Only send notification if the page is not visible (user is on another tab)
    if (document.visibilityState !== 'visible') {
      try {
        const notification = new Notification(title, options);
        
        // Handle notification click - focuses the window
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        return notification;
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    }
    
    return null;
  }, [permission]);

  return {
    permission,
    requestPermission,
    sendNotification,
  };
}
