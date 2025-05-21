import { NotificationSoundOption } from '@/contexts/NotificationContext';

// Notification sounds from Supabase
export const NOTIFICATION_SOUNDS = [
  { id: 'none' as NotificationSoundOption, name: 'No Sound', path: '' },
  { id: 'alarm-digital' as NotificationSoundOption, name: 'Digital Alarm', path: 'https://zvlvfapcqfhlmaoyyord.supabase.co/storage/v1/object/public/sounds//alarm-digital.mp3' },

];

/**
 * Gets the sound path for a given notification sound ID
 */
export function getNotificationSoundPath(soundId: NotificationSoundOption): string {
  const sound = NOTIFICATION_SOUNDS.find(s => s.id === soundId);
  return sound ? sound.path : '';
}
