import { SoundOption } from '@/contexts/TimerContext';

// Use direct URLs for Supabase hosted sounds
export const SOUNDS = [
  { id: 'none' as SoundOption, name: 'No Sound', path: '' },
  { id: 'rain' as SoundOption, name: 'Rain', path: 'https://zvlvfapcqfhlmaoyyord.supabase.co/storage/v1/object/public/sounds//rain2.mp3' },
  { id: 'forest' as SoundOption, name: 'Forest', path: '/sounds/forest.mp3' },
  { id: 'cafe' as SoundOption, name: 'Cafe', path: '/sounds/cafe.mp3' },
  { id: 'whitenoise' as SoundOption, name: 'White Noise', path: '/sounds/whitenoise.mp3' },
];

/**
 * Gets the sound path for a given sound ID
 */
export function getSoundPath(soundId: SoundOption): string {
  const sound = SOUNDS.find(s => s.id === soundId);
  return sound ? sound.path : `/sounds/${soundId}.mp3`;
} 