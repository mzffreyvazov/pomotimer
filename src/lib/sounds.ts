import { SoundOption } from '@/contexts/TimerContext';

// Use direct URLs for Supabase hosted sounds
export const SOUNDS = [
  { id: 'none' as SoundOption, name: 'No Sound', path: '' },
  { id: 'rain' as SoundOption, name: 'Rain', path: 'https://zvlvfapcqfhlmaoyyord.supabase.co/storage/v1/object/public/sounds//rain2.mp3' },
  { id: 'forest' as SoundOption, name: 'Forest', path: 'https://zvlvfapcqfhlmaoyyord.supabase.co/storage/v1/object/public/sounds//forest.mp3' },
  { id: 'cafe' as SoundOption, name: 'Cafe', path: 'https://zvlvfapcqfhlmaoyyord.supabase.co/storage/v1/object/public/sounds//museum-cafe-55154.mp3' },
  { id: 'whitenoise' as SoundOption, name: 'White Noise', path: 'https://zvlvfapcqfhlmaoyyord.supabase.co/storage/v1/object/public/sounds//whitenoise-75254.mp3' },
  { id: 'fireplace' as SoundOption, name: 'Fireplace', path: 'https://zvlvfapcqfhlmaoyyord.supabase.co/storage/v1/object/public/sounds//fireplace.mp3' },
];

/**
 * Gets the sound path for a given sound ID
 */
export function getSoundPath(soundId: SoundOption): string {
  const sound = SOUNDS.find(s => s.id === soundId);
  return sound ? sound.path : `/sounds/${soundId}.mp3`;
} 